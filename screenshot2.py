#!/usr/bin/env python3
"""滑板人生 - 捕获更多界面截图"""
import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=['--no-sandbox', '--disable-setuid-sandbox']
        )
        page = await browser.new_page(viewport={'width': 1280, 'height': 720})

        base_path = 'D:/Program Files/TraeProjects/01_开发项目/AI应用/Github/babysteps-webside/images'

        # 1. 开始界面（已有）
        await page.goto('https://skate-life.pages.dev/')
        await page.wait_for_timeout(3000)
        await page.screenshot(path=f'{base_path}/skate-life-start.png', full_page=False)
        print('1. 开始界面完成')

        # 2. 点击开始游戏，捕获游戏进行中界面
        start_btn = page.locator('button:has-text("开始游戏")').first
        if start_btn:
            await start_btn.click()
            await page.wait_for_timeout(5000)
            await page.screenshot(path=f'{base_path}/skate-life-gameplay.png', full_page=False)
            print('2. 游戏进行中完成')

        # 3. 继续游戏
        await page.wait_for_timeout(5000)
        await page.screenshot(path=f'{base_path}/skate-life-mid.png', full_page=False)
        print('3. 游戏中期完成')

        await browser.close()
        print('滑板人生截图完成')

asyncio.run(main())
