import { error } from 'console';
import ApiProcess from '../lib/pre_post_process';
import SessionVisualLib from '../lib/session_visual_lib'
class TestCase1 extends ApiProcess {

/*-------------------------------------------------------------------------------------------------------------------------*/
/*-------------------------------------------------------------- Innitial Setup & Postprocessing --------------------------*/
/*-------------------------------------------------------------------------------------------------------------------------*/
    private driver: WebdriverIO.MochaOpts | undefined;
    constructor() {
        super();
        this.apkversion = "";
        this.no_reset = true;
        this.autolaunch = false;
        this.app_name = 'dailymail';
        this.test_name = 'demo_test';
        this.kpi_category = 'kpi';
        this.activity = 'com.google.android.googlequicksearchbox.SearchActivity';
        this.packages = 'com.google.android.googlequicksearchbox';
        this.read_terminal();
    }

    async runTest() {
        try {
            await this.initialize();
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
                console.log('Driver created successfully.');
            } else {
                console.error('Failed to create driver:', code, error);
            }
        } catch (error) {
            console.error('Error creating driver:', error);
        }
    }

    async postprocessing() {
        console.log("teardown started...")
        if(this.totalcount===this.passcount) {
            this.status = 'Passed'
            this.data['status'] = this.status
        }
        try {
            if(this.driver) {
                await this.driver.deleteSession();
            }
        }
        catch {
            console.log("driver is quited")
        }
        const teardown = new SessionVisualLib(this.data);
        await teardown.run_record_session_info();
    }


/*-------------------------------------------------------------------------------------------------------------------------*/
/*-------------------------------------------------------------- SupportMethod --------------------------------------------*/
/*-------------------------------------------------------------------------------------------------------------------------*/

    async launch_app() {
        if (this.driver) { 
            this.data['kpi']['LaunchApp']['start'] = new Date().getTime()
            await this.driver.launch_app
        }
    }
    async click_search() {
        if (this.driver) {
            const element = await this.driver.$('(//android.widget.TextView[@text="Search"])[1]');
            this.data['kpi']['LaunchApp']['end'] = new Date().getTime()
            await element.click();
            console.log("clicked the search button...")
            this.data['kpi']['LaunchApp']['start_sensitivity'] = this.get_value('LaunchApp','start_sensitivity')
            this.data['kpi']['LaunchApp']['end_sensitivity'] = this.get_value('LaunchApp','end_sensitivity')
            this.data['kpi']['LaunchApp']['segment_start'] = this.get_value('LaunchApp','segment_start')
            this.data['kpi']['LaunchApp']['segment_end'] = this.get_value('LaunchApp','segment_end')
        }
    }

    async send_key() {
        if (this.driver) {
            const textsent = await this.driver.$('//android.widget.EditText[contains(@text,"Search")]');
            await textsent.setValue("Appium");
            console.log("key sent...")
            this.data['kpi']['SearchTime']['start'] = new Date().getTime()
            await this.driver.execute('mobile: performEditorAction', { action: 'search' });
            const verify = await this.driver.$('(//android.view.View[@text="Appium"])[1]');
            verify.waitForDisplayed({ timeout: 10000 });
            this.data['kpi']['SearchTime']['end'] = new Date().getTime()
        }
    }

    async wait_for_10s() {
        if (this.driver) {
            console.log("waiting for 10 second")
            await this.driver.pause(10000);
        }
    }

    async end_session() {
        if (this.driver) {
            await this.driver.deleteSession();
            console.log(this.data)
        }
    }

/*-------------------------------------------------------------------------------------------------------------------------*/
/*-------------------------------------------------------------- TestCase -------------------------------------------------*/
/*-------------------------------------------------------------------------------------------------------------------------*/

    async test_001() {
            await this.launch_app();
            await this.click_search();
            await this.send_key();
            await this.wait_for_10s();
            await this.end_session();
        }
}
        
/*-------------------------------------------------------------------------------------------------------------------------*/
/*-------------------------------------------------------------- ObjectCreation --------------------------------------------*/
/*-------------------------------------------------------------------------------------------------------------------------*/
const testobj = new TestCase1();
testobj.runTest().catch(error => console.error('Error:', error));


