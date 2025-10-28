import asyncio
from playwright import async_api
from playwright.async_api import expect

async def run_test():
    pw = None
    browser = None
    context = None
    
    try:
        # Start a Playwright session in asynchronous mode
        pw = await async_api.async_playwright().start()
        
        # Launch a Chromium browser in headless mode with custom arguments
        browser = await pw.chromium.launch(
            headless=True,
            args=[
                "--window-size=1280,720",         # Set the browser window size
                "--disable-dev-shm-usage",        # Avoid using /dev/shm which can cause issues in containers
                "--ipc=host",                     # Use host-level IPC for better stability
                "--single-process"                # Run the browser in a single process mode
            ],
        )
        
        # Create a new browser context (like an incognito window)
        context = await browser.new_context()
        context.set_default_timeout(5000)
        
        # Open a new page in the browser context
        page = await context.new_page()
        
        # Navigate to your target URL and wait until the network request is committed
        await page.goto("http://localhost:3000", wait_until="commit", timeout=10000)
        
        # Wait for the main page to reach DOMContentLoaded state (optional for stability)
        try:
            await page.wait_for_load_state("domcontentloaded", timeout=3000)
        except async_api.Error:
            pass
        
        # Iterate through all iframes and wait for them to load as well
        for frame in page.frames:
            try:
                await frame.wait_for_load_state("domcontentloaded", timeout=3000)
            except async_api.Error:
                pass
        
        # Interact with the page elements to simulate user flow
        # -> Input login credentials and submit login form.
        frame = context.pages[-1]
        # Input email for login
        elem = frame.locator('xpath=html/body/div/div/div[2]/div[2]/form/div/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('contato@procexai.tech')
        

        frame = context.pages[-1]
        # Input password for login
        elem = frame.locator('xpath=html/body/div/div/div[2]/div[2]/form/div[2]/div/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('ProcexAI1010!')
        

        frame = context.pages[-1]
        # Click Entrar button to login
        elem = frame.locator('xpath=html/body/div/div/div[2]/div[2]/form/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Test navigation between dates by clicking next and previous week buttons if available.
        frame = context.pages[-1]
        # Click next week button to navigate to the next week in the calendar
        elem = frame.locator('xpath=html/body/div/div[2]/main/div/div/div[3]/div/button[2]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Test navigation to previous week and switch calendar views to Dia and Mês to verify date navigation and view changes.
        frame = context.pages[-1]
        # Click previous week button to navigate to the previous week in the calendar
        elem = frame.locator('xpath=html/body/div/div[2]/main/div/div/div[3]/div/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        frame = context.pages[-1]
        # Switch calendar view to Dia (Day)
        elem = frame.locator('xpath=html/body/div/div[2]/main/div/div/div[3]/div[2]/div/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Test creating a new appointment by clicking the 'Novo Agendamento' button to verify appointment creation functionality.
        frame = context.pages[-1]
        # Click 'Novo Agendamento' button to start creating a new appointment
        elem = frame.locator('xpath=html/body/div/div[2]/main/div/div/div/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Select a patient from the dropdown to proceed with creating a new appointment.
        frame = context.pages[-1]
        # Open patient selection dropdown to choose a patient
        elem = frame.locator('xpath=html/body/div[5]/div[2]/div/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Verify calendar responsiveness by resizing or scrolling and confirm that the calendar displays no appointments correctly.
        await page.mouse.wheel(0, await page.evaluate('() => window.innerHeight'))
        

        await page.mouse.wheel(0, -await page.evaluate('() => window.innerHeight'))
        

        # -> Click the 'Cancelar' button (index 9) to close the new appointment form and return to the calendar view.
        frame = context.pages[-1]
        # Click 'Cancelar' button to close the new appointment form
        elem = frame.locator('xpath=html/body/div[5]/div[3]/div[2]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Verify calendar responsiveness by resizing or scrolling and confirm that the calendar displays no appointments correctly.
        await page.mouse.wheel(0, await page.evaluate('() => window.innerHeight'))
        

        await page.mouse.wheel(0, -await page.evaluate('() => window.innerHeight'))
        

        # --> Assertions to verify final state
        frame = context.pages[-1]
        await expect(frame.locator('text=Agenda').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Gerencie seus agendamentos').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Novo Agendamento').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=segunda-feira, 27 de outubro de 2025').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=outubro 2025').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=dom').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=seg').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=ter').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=qua').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=qui').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=sex').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=sab').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=0 agendamento(s) para este dia').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Nenhum agendamento').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Total').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=0').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Agendados').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Concluídos').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Cancelados').first).to_be_visible(timeout=30000)
        await asyncio.sleep(5)
    
    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()
            
asyncio.run(run_test())
    