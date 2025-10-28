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
        # -> Input email and password, then click Entrar to login
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
        

        # -> Click on Disponibilidade module link to access therapist availability management
        frame = context.pages[-1]
        # Click on Disponibilidade module link
        elem = frame.locator('xpath=html/body/div/div/nav/a[3]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Click the 'Adicionar' button to add the default availability schedule for Monday 09:00 to 17:00
        frame = context.pages[-1]
        # Click 'Adicionar' button to add new availability schedule for Monday 09:00 to 17:00
        elem = frame.locator('xpath=html/body/div/div[2]/main/div/div/div[2]/div[2]/div/div[2]/div/div[4]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Click on the 'Exceções' tab to test adding exceptions to the schedule
        frame = context.pages[-1]
        # Click on 'Exceções' tab to access exceptions management
        elem = frame.locator('xpath=html/body/div/div[2]/main/div/div/div[2]/div/button[2]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Try clicking the date input field to open the date picker and select a date instead of typing it directly.
        frame = context.pages[-1]
        # Click on the date input field to open date picker for selecting a date
        elem = frame.locator('xpath=html/body/div/div[2]/main/div/div/div[2]/div[3]/div/div[2]/div/div/input').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # --> Assertions to verify final state
        frame = context.pages[-1]
        await expect(frame.locator('text=Dashboard').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Agenda').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Disponibilidade').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Pacientes').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Financeiro').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Prontuários').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=ProceX - Teste').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Terapeuta').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Sair3C').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Disponibilidade').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Configure os horários de disponibilidade dos terapeutas').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Horários Regulares').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Exceções').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Crie bloqueios ou horários extras para datas específicas').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Data').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Tipo').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Bloqueio').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Início').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Fim').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Observações').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Criar').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Nenhuma exceção cadastrada').first).to_be_visible(timeout=30000)
        await asyncio.sleep(5)
    
    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()
            
asyncio.run(run_test())
    