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
        this.test_name = 'Test002 MOL iOS';
        this.kpi_category = 'kpi';
        this.activity = 'com.google.android.googlequicksearchbox.SearchActivity';
        this.packages = 'com.and.mailonline';
        this.read_terminal();
    }
    async runTest() {
        try {
            await this.initialize();
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
                    this.terminate_app()
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

    async click_search() {
        if (this.driver) {
            this.failreason = "Fail to click search icon";
            LogInfo('Waiting for search button')
            await this.driver.pause(10000);
            this.data['kpi']['LaunchApp']['end'] = new Date().getTime();
            await this.driver.pause(5000);
            await this.tapOnCoordinates(383,71)
            LogInfo('clicked search button')
            this.passcount+=1;
            this.data['kpi']['LaunchApp']['start_sensitivity'] = this.get_value('LaunchApp','start_sensitivity');
            this.data['kpi']['LaunchApp']['end_sensitivity'] = this.get_value('LaunchApp','end_sensitivity');
        }
    }

    async send_key(text:string) {
        if (this.driver) {
            this.failreason = "Fail to send test to search box"
            LogInfo('waiting for search entrobox')
            const search=await this.driver.$('//XCUIElementTypeSearchField[contains(@name,"Search")]');
            // await search.waitForExist({ timeout: 10000, timeoutMsg: 'Search box not found' });
            await search.click();
            LogInfo('clicked search entrobox')
            this.passcount+=1;
            const textsent = await this.driver.$('//XCUIElementTypeSearchField');
            await textsent.setValue(text);
            LogInfo('sent keys to search entry box')
            const search_button=await this.driver.$('//XCUIElementTypeButton[@name="Search"]');
            this.data['kpi']['SearchTime']['start'] = new Date().getTime()-1500
            await search_button.click();
            LogInfo('clicked search button')
            LogInfo('waiting for verification')
            const verify = await this.driver.$('//XCUIElementTypeStaticText[contains(@name,"articles for")]');
            LogInfo('verification completed')
            this.data['kpi']['SearchTime']['end'] = new Date().getTime()+1500
            await new Promise(resolve => setTimeout(resolve, 5000));
            this.data['kpi']['SearchTime']['start_sensitivity'] = this.get_value('SearchTime','start_sensitivity');
            this.data['kpi']['SearchTime']['end_sensitivity'] = this.get_value('SearchTime','end_sensitivity');
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
        await this.click_search();
        await this.send_key('football');
        await this.terminate_app()
    }
}   
const testobj = new TestCase1();
LogInfo('Test started')
testobj.runTest().catch(error => console.error('Error:', error));