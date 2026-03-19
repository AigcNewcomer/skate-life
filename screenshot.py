#!/usr/bin/env python3
"""截图脚本 - 为滑板人生捕获开始界面"""
import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        # 启动 Chromium（headless模式）
        browser = await p.chromium.launch(
            headless=True,
            args=['--no-sandbox', '--disable-setuid-sandbox']
        )
        page = await browser.new_page(viewport={'width': 1280, 'height': 720})

        # 访问滑板人生
        await page.goto('https://skate-life.pages.dev/')
        await page.wait_for_timeout(3000)  # 等待页面加载

        # 截图开始界面（不要点击任何按钮）
        await page.screenshot(path='D:/Program Files/TraeProjects/01_开发项目/AI应用/Github/babysteps-webside/images/skate-life-start.png', full_page=False)

        print('截图完成: skate-life-start.png')
        await browser.close()

asyncio.run(main())
