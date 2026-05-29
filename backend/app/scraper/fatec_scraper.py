"""
Web scraper da FATEC Zona Sul e ARINTER.
Usa Playwright para páginas dinâmicas + BeautifulSoup para parsing.
Roda automaticamente a cada 6 horas via APScheduler.
"""
import asyncio
import re
from datetime import datetime
from typing import List, Optional
from dataclasses import dataclass, field

from playwright.async_api import async_playwright, Browser, Page
from bs4 import BeautifulSoup
from loguru import logger

from app.core.config import settings


@dataclass
class ScrapedItem:
    title: str
    content: str
    category: str
    url: str = ""
    date: Optional[datetime] = None
    tags: List[str] = field(default_factory=list)


class FATECScraper:
    BASE_URL = "https://www.fateczonasul.edu.br"
    ARINTER_URL = "https://www.cpscetec.com.br/arinter"

    def __init__(self):
        self._browser: Optional[Browser] = None

    async def __aenter__(self):
        playwright = await async_playwright().start()
        self._browser = await playwright.chromium.launch(
            headless=True,
            args=["--no-sandbox", "--disable-dev-shm-usage"],
        )
        return self

    async def __aexit__(self, *_):
        if self._browser:
            await self._browser.close()

    async def _get_page(self, url: str) -> Optional[str]:
        if not self._browser:
            return None
        try:
            context = await self._browser.new_context(
                user_agent=(
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/120.0.0.0 Safari/537.36"
                ),
                locale="pt-BR",
            )
            page: Page = await context.new_page()
            await page.goto(url, wait_until="networkidle", timeout=30000)
            content = await page.content()
            await context.close()
            return content
        except Exception as e:
            logger.error(f"Failed to fetch {url}: {e}")
            return None

    # ── FATEC Zona Sul ─────────────────────────────────────────────────────────
    async def scrape_fatec_news(self) -> List[ScrapedItem]:
        url = f"{self.BASE_URL}/noticias"
        html = await self._get_page(url)
        if not html:
            return []

        soup = BeautifulSoup(html, "lxml")
        items = []

        for article in soup.select("article, .noticia, .post, .news-item"):
            title_el = article.select_one("h1, h2, h3, h4, .titulo, .title")
            content_el = article.select_one("p, .resumo, .excerpt, .content")
            link_el = article.select_one("a[href]")
            date_el = article.select_one("time, .data, .date")

            if not title_el:
                continue

            title = title_el.get_text(strip=True)
            content = content_el.get_text(strip=True) if content_el else ""
            link = self._make_absolute(link_el["href"] if link_el else "", self.BASE_URL)
            date = self._parse_date(date_el.get_text() if date_el else "")

            if title and content:
                items.append(ScrapedItem(
                    title=title,
                    content=content,
                    category="noticia",
                    url=link,
                    date=date,
                    tags=["fatec", "noticia"],
                ))

        logger.info(f"FATEC scraper: {len(items)} news items")
        return items

    async def scrape_fatec_calendar(self) -> List[ScrapedItem]:
        url = f"{self.BASE_URL}/calendario-academico"
        html = await self._get_page(url)
        if not html:
            # Fallback: calendário padrão FATEC SP
            return self._get_default_calendar()

        soup = BeautifulSoup(html, "lxml")
        items = []

        for row in soup.select("table tr, .calendario-item, .evento"):
            cells = row.select("td, th")
            if len(cells) >= 2:
                date_text = cells[0].get_text(strip=True)
                event_text = cells[1].get_text(strip=True)
                if date_text and event_text:
                    items.append(ScrapedItem(
                        title=event_text,
                        content=f"Data: {date_text} — {event_text}",
                        category="calendario",
                        url=url,
                        date=self._parse_date(date_text),
                        tags=["fatec", "calendario", "academico"],
                    ))

        logger.info(f"FATEC calendar scraper: {len(items)} events")
        return items if items else self._get_default_calendar()

    async def scrape_fatec_courses(self) -> List[ScrapedItem]:
        url = f"{self.BASE_URL}/cursos"
        html = await self._get_page(url)
        if not html:
            return []

        soup = BeautifulSoup(html, "lxml")
        items = []

        for course_el in soup.select(".curso, .card-curso, [class*='course']"):
            name_el = course_el.select_one("h2, h3, .nome, .titulo")
            desc_el = course_el.select_one("p, .descricao, .resumo")
            if name_el:
                items.append(ScrapedItem(
                    title=name_el.get_text(strip=True),
                    content=desc_el.get_text(strip=True) if desc_el else "",
                    category="curso",
                    url=url,
                    tags=["fatec", "curso"],
                ))

        logger.info(f"FATEC courses scraper: {len(items)} courses")
        return items

    # ── ARINTER ───────────────────────────────────────────────────────────────
    async def scrape_arinter(self) -> List[ScrapedItem]:
        urls = [
            (self.ARINTER_URL, "intercambio"),
            (f"{self.ARINTER_URL}/editais", "edital"),
            (f"{self.ARINTER_URL}/bolsas", "bolsa"),
        ]
        all_items = []

        for url, category in urls:
            html = await self._get_page(url)
            if not html:
                continue

            soup = BeautifulSoup(html, "lxml")
            for el in soup.select("article, .item, .programa, .edital, p"):
                title_el = el.select_one("h1, h2, h3, h4, strong, b")
                content_el = el.select_one("p, .content, .texto")
                if title_el:
                    all_items.append(ScrapedItem(
                        title=title_el.get_text(strip=True),
                        content=content_el.get_text(strip=True) if content_el else "",
                        category=category,
                        url=url,
                        tags=["arinter", "internacional", category],
                    ))

        logger.info(f"ARINTER scraper: {len(all_items)} items")
        return all_items

    # ── Scraping completo ──────────────────────────────────────────────────────
    async def scrape_all(self) -> List[ScrapedItem]:
        tasks = [
            self.scrape_fatec_news(),
            self.scrape_fatec_calendar(),
            self.scrape_fatec_courses(),
            self.scrape_arinter(),
        ]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        all_items = []
        for result in results:
            if isinstance(result, list):
                all_items.extend(result)
            elif isinstance(result, Exception):
                logger.error(f"Scraping task failed: {result}")
        logger.info(f"Total scraped: {len(all_items)} items")
        return all_items

    # ── Helpers ───────────────────────────────────────────────────────────────
    def _make_absolute(self, href: str, base: str) -> str:
        if href.startswith("http"):
            return href
        if href.startswith("/"):
            return base + href
        return base + "/" + href

    def _parse_date(self, text: str) -> Optional[datetime]:
        if not text:
            return None
        formats = [
            "%d/%m/%Y", "%d-%m-%Y", "%Y-%m-%d",
            "%d de %B de %Y", "%d/%m/%Y às %H:%M",
        ]
        for fmt in formats:
            try:
                return datetime.strptime(text.strip(), fmt)
            except ValueError:
                continue
        return None

    def _get_default_calendar(self) -> List[ScrapedItem]:
        """Calendário padrão 2026 como fallback."""
        events = [
            ("Início do 1º Semestre 2026", "2026-02-02", "inicio_semestre"),
            ("Carnaval — Recesso", "2026-02-16", "recesso"),
            ("1ª Prova Bimestral", "2026-04-06", "prova"),
            ("Tiradentes — Feriado", "2026-04-21", "feriado"),
            ("2ª Prova Bimestral", "2026-05-25", "prova"),
            ("Corpus Christi — Feriado", "2026-06-11", "feriado"),
            ("Encerramento 1º Semestre", "2026-07-04", "encerramento"),
            ("Recesso Julho", "2026-07-07", "recesso"),
            ("Início do 2º Semestre 2026", "2026-07-27", "inicio_semestre"),
            ("1ª Prova Bimestral — 2º Sem", "2026-09-07", "prova"),
            ("2ª Prova Bimestral — 2º Sem", "2026-11-09", "prova"),
            ("Encerramento do Ano Letivo", "2026-12-12", "encerramento"),
            ("Período de Rematrícula", "2026-11-23", "matricula"),
        ]
        items = []
        for title, date_str, tag in events:
            date = datetime.strptime(date_str, "%Y-%m-%d")
            items.append(ScrapedItem(
                title=title,
                content=f"{title} — {date.strftime('%d/%m/%Y')}",
                category="calendario",
                date=date,
                tags=["calendario", "academico", tag],
            ))
        return items


async def run_scraper_job():
    """Job agendado para atualizar a base de conhecimento."""
    from app.ai.rag import rag
    from langchain_core.documents import Document

    logger.info("Starting scheduled FATEC scraping job...")
    async with FATECScraper() as scraper:
        items = await scraper.scrape_all()

    docs = [
        Document(
            page_content=f"{item.title}\n\n{item.content}",
            metadata={
                "title": item.title,
                "category": item.category,
                "source": item.url,
                "tags": ",".join(item.tags),
                "scraped_at": datetime.utcnow().isoformat(),
            },
        )
        for item in items
        if item.content.strip()
    ]

    if docs:
        await rag.add_documents(docs)
        logger.info(f"Scraping job completed: {len(docs)} documents indexed to RAG")
