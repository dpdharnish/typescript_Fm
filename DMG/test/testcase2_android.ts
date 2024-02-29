import { error } from 'console';
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
        this.apkversion = "";
        this.no_reset = false;
        this.autolaunch = false;
        this.app_name = 'MailOnline';
        this.test_name = 'Test002 MOL Android';
        this.kpi_category = 'kpi';
        this.activity = 'com.dailymail.online.presentation.splash.SplashActivity';
        this.packages = 'com.dailymail.online';
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

    async click_search() {
        if (this.driver) {
            this.failreason = "Fail to click search icon"
            await this.driver.pause(5000)
            try {
                const popup = await this.driver.$('//android.widget.Button[@text="GOT IT"]');
                LogInfo('verified popup')
                popup.click();
                this.data['kpi']['LaunchApp']['end'] = new Date().getTime()
            }
            catch {
                const element = await this.driver.$('//android.widget.Button[@content-desc="Search"]');
                LogInfo('verified search element')
                this.data['kpi']['LaunchApp']['end'] = new Date().getTime()
            }
            var element = await this.driver.$('//android.widget.Button[@content-desc="Search"]');
            await element.click();
            LogInfo('clicked the search button') 
            this.data['kpi']['LaunchApp']['start_sensitivity'] = this.get_value('LaunchApp','start_sensitivity')
            this.data['kpi']['LaunchApp']['end_sensitivity'] = this.get_value('LaunchApp','end_sensitivity')
        }
        this.passcount+=1
    }

    async send_key(key:string) {
        if (this.driver) {
            this.failreason = "Fail to send test to search box"
            await this.driver.pause(3000)
            const textsent = await this.driver.$('//android.widget.EditText[contains(@text,"Search MailOnline")]');
            await textsent.click();
            await this.driver.pause(2000)
            await textsent.setValue(key);
            LogInfo(`sent key ${key}`) 
            this.data['kpi']['SearchTime']['start'] = new Date().getTime()
            LogInfo("clicked search")
            await this.driver.execute('mobile: performEditorAction', { action: 'search' });
            await this.driver.pause(2000)
            const verify = await this.driver.$('//android.widget.TextView[contains(@text,"RESULTS FOUND")]');
            LogInfo("verifyed search")
            this.data['kpi']['SearchTime']['end'] = new Date().getTime()
            await this.driver.pause(5000)

        }
        this.passcount+=1
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
    async test_002() {
        await this.launch_app();
        await this.click_search();
        await this.send_key('football');
        await this.terminate_app()
    }
}
/*-------------------------------------------------------------------------------------------------------------------------*/
/*-------------------------------------------------------------- ObjectCreation --------------------------------------------*/
/*-------------------------------------------------------------------------------------------------------------------------*/
const testobj = new TestCase1();
testobj.runTest().catch(error => console.error('Error:', error));