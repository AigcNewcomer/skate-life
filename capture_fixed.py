#!/usr/bin/env python3
"""滑板人生 - 正确截图脚本（修复黑边问题）"""
import asyncio
from playwright.async_api import async_playwright
import os

async def capture_screenshots():
    async with async_playwright() as p:
        # 使用移动端视口，模拟全面屏手机
        browser = await p.chromium.launch(
            channel='chrome',
            headless=True,
            args=[
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--hide-scrollbars',
                '--hide-cursors'
            ]
        )

        # 创建无系统条的移动端上下文
        context = await browser.new_context(
            viewport={'width': 390, 'height': 844},  # iPhone 14 Pro 尺寸
            device_scale_factor=2,
            permissions=[]
        )
        page = await context.new_page()

        base_path = 'D:/Program Files/TraeProjects/01_开发项目/AI应用/Github/babysteps-webside/images'

        # 1. 截取开始界面
        await page.goto('http://localhost:5502/')
        await page.wait_for_timeout(3000)
        await page.screenshot(
            path=f'{base_path}/skate-life-01-start.png',
            full_page=False,
            animations='disabled'
        )
        print('1. 开始界面完成')

        # 2. 点击开始游戏
        start_btn = page.locator('button.gameBtn')
        await start_btn.click()
        await page.wait_for_timeout(2000)

        # 3. 截取游戏进行中的画面（让障碍物和金币出现）
        await page.screenshot(
            path=f'{base_path}/skate-life-02-gameplay.png',
            full_page=False,
            animations='disabled'
        )
        print('2. 游戏界面1 完成')

        # 4. 再等待一会，截取更多障碍物的画面
        await page.wait_for_timeout(3000)
        await page.screenshot(
            path=f'{base_path}/skate-life-03-gameplay2.png',
            full_page=False,
            animations='disabled'
        )
        print('3. 游戏界面2 完成')

        # 5. 等待更久，截取更激烈的场面
        await page.wait_for_timeout(5000)
        await page.screenshot(
            path=f'{base_path}/skate-life-04-gameplay3.png',
            full_page=False,
            animations='disabled'
        )
        print('4. 游戏界面3 完成')

        await browser.close()
        print('滑板人生截图完成！')

asyncio.run(capture_screenshots())