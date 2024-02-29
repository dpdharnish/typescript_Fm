import ApiProcess from '../lib/pre_post_process';
import {LogError,LogInfo} from '../lib/logger'
import SessionVisualLib from '../lib/session_visual_lib'

class TestCase1 extends ApiProcess {
/*-------------------------------------------------------------------------------------------------------------------------*/
/*-------------------------------------------------------------- Innitial Setup & Postprocessing --------------------------*/
/*-------------------------------------------------------------------------------------------------------------------------*/
    private driver: WebdriverIO.MochaOpts | undefined;
    constructor() {
        super();
        this.totalcount = 4
        this.passcount = 0;
        this.apkversion = "";
        this.no_reset = false;
        this.autolaunch = false;
        this.app_name = 'MailOnline';
        this.test_name = 'Test001 MOL iOS';
        this.kpi_category = 'kpi';
        this.activity = 'com.google.android.googlequicksearchbox.SearchActivity';
        this.packages = 'com.and.mailonline';
        this.read_terminal();
    }
    async runTest() {
        try {
            await this.initialize();
            LogInfo('Starting test case');
            await this.test_002();
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
            LogInfo(this.status)
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
/*-------------------------------------------------------------- basictMethod --------------------------------------------*/
/*-------------------------------------------------------------------------------------------------------------------------*/
    async tapOnCoordinates(x: number, y: number) {
        if (this.driver) {
            await this.driver.touchAction([
                { action: 'tap', x: x, y: y }
            ]);
        }
    }
    async performSwipe(startX:number,startY:number,endX:number,endY:number) {
        if (this.driver){
            const screen_size = await this.driver.getWindowRect();
            let width = screen_size.width;
            let height = screen_size.height;
            await this.driver.touchAction([
                { action: 'press', x: startX, y: startY },
                { action: 'wait', ms: 2000 },
                { action: 'moveTo', x: endX, y: endY },
                'release'
            ]);
        }
    }
/*-------------------------------------------------------------------------------------------------------------------------*/
/*-------------------------------------------------------------- SupportMethod --------------------------------------------*/
/*-------------------------------------------------------------------------------------------------------------------------*/
    async launch_app() {
        if (this.driver) { 
            await new Promise(resolve => setTimeout(resolve, 5000));
            this.data['kpi']['LaunchApp']['start'] = new Date().getTime()-10000;
            LogInfo('launching app') 
            await this.driver.execute('mobile: launchApp', { bundleId: this.packages });
            LogInfo('App Launched')
            this.passcount+=1;
        }
    }

    async click_more() {
        if (this.driver) {
            this.failreason = "Fail to click search icon";
            LogInfo('Waiting for more button');
            await this.driver.pause(10000);
            this.data['kpi']['LaunchApp']['end'] = new Date().getTime();
            await this.driver.pause(5000);
            await this.tapOnCoordinates(380,835);
            // await this.tapOnCoordinates(355,780);
            await this.driver.pause(3000);
            LogInfo('clicked More button')
            this.passcount+=1;
            this.data['kpi']['LaunchApp']['start_sensitivity'] = this.get_value('LaunchApp','start_sensitivity');
            this.data['kpi']['LaunchApp']['end_sensitivity'] = this.get_value('LaunchApp','end_sensitivity');
        }
    }
    async click_sci_tech() {
        if (this.driver) {
            this.failreason = "Fail to click sci_tech";
            await this.performSwipe(200,600,200,200)
            LogInfo('swiped')
            await this.driver.pause(2000);
            const tech=await this.driver.$('//XCUIElementTypeStaticText[@name="Sci-Tech"]');
            await tech.click();
            LogInfo('clicked sci_tech')
            this.passcount+=1;
            await this.driver.pause(2000);
            await this.driver.$('//XCUIElementTypeStaticText[@name="Sci-Tech"]');
            // await this.driver.waitForExist('//XCUIElementTypeStaticText[@name="Sci-Tech"]', 5000); 
        }
    }

    async click_first_artical_and_verify() {
        if (this.driver){
            this.failreason = "fail click_first_artical_and_verify";
            await this.driver.pause(2000);
            const article = await this.driver.$('(//XCUIElementTypeCell[@name="featuredCellIdentifier"]//preceding-sibling::XCUIElementTypeStaticText[@visible="true"])[1]')
            var article_text = await article.getText(); 
            LogInfo(article_text)
            this.data['kpi']['ArticlePageLoadTime']['start'] = new Date().getTime();
            const firstarticle = await this.driver.$('//XCUIElementTypeCell[@name="featuredCellIdentifier"]');
            await firstarticle.click();
            await this.driver.pause(2000);
            this.data['kpi']['ArticlePageLoadTime']['end'] = new Date().getTime();
            const image = await this.driver.$('(//XCUIElementTypeImage)[2]');
            await image.isDisplayed();
            LogInfo("Verified image displayed")
            this.passcount+=1;

        }
    }
    async end_session() {
        if (this.driver) {
            await this.driver.deleteSession();
        }
    }
    async terminate_app() {
        if(this.driver) {
            LogInfo('terminatingApp')
            await this.driver.pause(3000);
            await this.driver.execute('mobile: terminateApp', { bundleId:this.packages });
        }
    }
/*-------------------------------------------------------------------------------------------------------------------------*/
/*-------------------------------------------------------------- MainMethod --------------------------------------------*/
/*-------------------------------------------------------------------------------------------------------------------------*/
    async test_002() {
        await this.launch_app();
        await this.click_more();
        await this.click_sci_tech();
        await this.click_first_artical_and_verify();
        await this.terminate_app();
    }
}   
const testobj = new TestCase1();
LogInfo('Test started')
testobj.runTest().catch(error => console.error('Error:', error));