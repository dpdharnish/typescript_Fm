/*-------------------------------------------------------------------------------------------------------------------------*/
/*-------------------------------------------- import librarys ------------------------------------------------------------*/
/*-------------------------------------------------------------------------------------------------------------------------*/
import * as assert from "assert";
import ApiProcess from '../lib/pre_post_process';
import SessionVisualLib from '../lib/session_visual_lib'
import {LogError,LogInfo} from '../lib/logger'

class TestCase1 extends ApiProcess {
    private driver: WebdriverIO.MochaOpts | undefined;

/*-------------------------------------------------------------------------------------------------------------------------*/
/*-------------------------------------------------------------- Innitial Setup & Postprocessing --------------------------*/
/*-------------------------------------------------------------------------------------------------------------------------*/

    constructor() {
        super();
        this.totalcount = 3
        this.passcount = 0;
        this.apkversion = "";
        this.no_reset = false;
        this.autolaunch = false;
        this.app_name = 'MailOnline';
        this.test_name = 'Test001 MOL Android';
        this.kpi_category = 'kpi';
        this.activity = 'com.dailymail.online.presentation.splash.SplashActivity';
        this.packages = 'com.dailymail.online';
        this.read_terminal();
    }

    async runTest() {
        try {
            await this.initialize();
            LogInfo('Starting test case');
            await this.test_001();
        } finally {
            await this.postprocessing();
        }
    }

    async initialize() {
        try {
            const { code, driver, error } = await this.create_driver();
            if (code === 200 && driver) {
                this.driver = driver;
                LogInfo('Driver created successfully.');
                await this.driver.pause(2000);
            } else {
                LogError(`Failed to create driver:${code} ${error}`);
            }
        } catch (error) {
            LogError(`Error creating driver: ${error}`);
        }
    }

    async postprocessing() {
        LogInfo("teardown started")
        if(this.totalcount===this.passcount) {
            this.status = 'Passed'
            LogInfo(`status: ${this.status}`)
            this.data['status'] = this.status
            this.data['fail_reason'] = this.status
        }
        else {
            this.data['fail_reason'] = this.failreason
            LogError(this.failreason)
            try {
                if (this.driver) {
                    await this.terminate_app()
                    LogInfo('App terminated')
                }
            }
            catch {
                LogInfo('App terminated')
            }
        }
        try {
            if(this.driver) {
                await this.driver.deleteSession();
                LogInfo("driver quited")
            }
        }
        catch {
            LogInfo("driver quited")
        }
        const teardown = new SessionVisualLib(this.data);
        await teardown.run_record_session_info();
        LogInfo("session status: "+this.status);
        LogInfo(`https://ui.headspin.io/sessions/${this.data['sessionId']}/waterfall`);
    }

/*-------------------------------------------------------------------------------------------------------------------------*/
/*-------------------------------------------------------------- SupportMethod --------------------------------------------*/
/*-------------------------------------------------------------------------------------------------------------------------*/
   

    async launch_app() {
        if (this.driver) {
            await new Promise(resolve => setTimeout(resolve, 5000)); 
            this.data['kpi']['LaunchApp']['start'] = new Date().getTime()
            LogInfo('launching app') 
            await this.driver.startActivity(this.packages,this.activity)
            this.passcount+=1
        }
    }

    async swipe_science() {
        if (this.driver) {
            try {
                const popup = await this.driver.$('//android.widget.Button[@text="GOT IT"]');
                LogInfo('verified popup')
                popup.click();
                this.data['kpi']['LaunchApp']['end'] = new Date().getTime() +4000
                }
            catch {        
                        LogInfo('verified search element')          
                    }                 
            this.failreason = "Fail to click search icon"
            await this.driver.pause(5000)
            let sci_btn;   
            const maxAttempts = 10;
            let attempts = 0; 
            while (attempts < maxAttempts) {           
                await this.performSwipe();    
                try{
                    sci_btn = await this.driver.$('//*[@text="Sci-Tech"]');
                    await sci_btn.click()
                    this.data['kpi']['ArticlePageLoadTime']['start'] = new Date().getTime()
                    break
                }
                catch
                {
                    LogInfo("Sci-Tech still not found");
                }
                attempts++;
                }
            }       
            this.passcount+=1        
        }

        async find_article() {
            if (this.driver) {
                this.failreason = "Fail to find article"
                await this.driver.pause(2000)
                const article_title = await this.driver.$('(//*[@class = "android.widget.FrameLayout"]//preceding-sibling::android.widget.TextView)[2]');
                this.data['kpi']['ArticlePageLoadTime']['end'] = new Date().getTime()
                const article_text1= await article_title.getText();
                LogInfo(article_text1)
                LogInfo('Article found')
                this.failreason = "Fail to open article"
                await article_title.click()
                LogInfo('Article opened')
                await this.driver.pause(2000)
                const opened_article = await this.driver.$('(//*[@class = "android.widget.FrameLayout"]//preceding-sibling::android.widget.TextView)[1]')
                const article_text2= await opened_article.getText();
                LogInfo(article_text2)
                await assert.strictEqual(article_text2,article_text1)
                this.failreason = "Fail to open article"
                await this.driver.$('id:android:id/primary').waitForDisplayed();
            }
        }       

    async performSwipe() {
        if (this.driver){
            const screen_size = await this.driver.getWindowRect();
            let width = screen_size.width;
            let height = screen_size.height;         
            const startX = width/1.4555;
            const startY= height/1.0149;
            const endX = width/5.4;
            const endY = height/1.0149;            
            await this.driver.touchAction([
                { action: 'press', x: startX, y: startY },
                { action: 'wait', ms: 2000 },
                { action: 'moveTo', x: endX, y: endY },
                'release'
            ]);
        }

    }


    async terminate_app() {
        if(this.driver) {
            LogInfo('terminatingApp')
            await this.driver.pause(3000);
            await this.driver.terminateApp(this.packages);
            this.passcount+=1
        }
    }
/*-------------------------------------------------------------------------------------------------------------------------*/
/*-------------------------------------------------------------- TestCase -------------------------------------------------*/
/*-------------------------------------------------------------------------------------------------------------------------*/
    async test_001() {
        await this.launch_app();
        await this.swipe_science();
        await this.find_article();
        await this.terminate_app()
    }
}
/*-------------------------------------------------------------------------------------------------------------------------*/
/*-------------------------------------------------------------- ObjectCreation --------------------------------------------*/
/*-------------------------------------------------------------------------------------------------------------------------*/
const testobj = new TestCase1();
testobj.runTest().catch(error => console.error('Error:', error));