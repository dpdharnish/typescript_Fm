/*-------------------------------------------------------------------------------------------------------------------------*/
/*-------------------------------------------- import librarys ------------------------------------------------------------*/
/*-------------------------------------------------------------------------------------------------------------------------*/
import yargs, { number } from 'yargs';
import { Data, ParsedArgs } from './types';
import { URL } from 'url';
import { remote, RemoteOptions } from 'webdriverio';
import { kpi } from './kpi'
import * as fs from 'fs/promises';
import { LogInfo, LogError } from './logger';


export default class ApiProcess {
    status = "Failed"
    failreason = "Failed to Launch"
    totalcount = 4;
    passcount = 0 ;
    apkversion: string = ""; // Assign default values or initialize in the constructor
    no_reset: boolean = false;
    autolaunch: boolean = false;
    app_name: string = "";
    test_name: string = "";
    kpi_category: string = "";
    activity: string = "";
    packages: string = "";
    data:Data={}; 

    async read_terminal() {
        const argv = yargs(process.argv.slice(2))
        .option('appium_input', {
            describe: 'Appium input URL',
            demandOption: true,
            type: 'string'
        })
        .option('udid', {
            describe: 'UDID',
            demandOption: true,
            type: 'string'
        })
        .option('os', {
            describe: 'Operating System',
            demandOption: true,
            type: 'string'
        })
        .help()
        .argv as unknown as ParsedArgs;

        const { appium_input, udid, os } = argv;
        this.data['udid'] = udid;
        this.data['appium-url'] = appium_input;
        this.data['os'] = os;
        this.data['app_name'] = this.app_name;
        this.data['test_name'] = this.test_name;
        this.data['kpi_category'] = this.kpi_category;
        this.data['activity'] = this.activity;
        this.data['packages'] = this.packages;
        this.data['no_reset'] = this.no_reset;
        this.data['autolaunch'] = this.autolaunch;
        this.data['apkversion'] = this.apkversion;
        this.data['status'] = this.status
        this.data['fail_reason'] = this.failreason
        await this.read_sensitivity()
    }

    async read_sensitivity() {
        try {
            const jsonString = await fs.readFile('sensitivity.json', 'utf-8');
            const jsonData = JSON.parse(jsonString);
            const testData = jsonData?.[this.test_name]?.[this.data['udid']] ?? jsonData?.[this.test_name]?.default;
            this.data['sensitivity'] = testData;
        } catch (error) {
            LogError(`Error reading JSON file: ${error}`);
        }
    }


    async create_driver(): Promise<{ code: number; driver?: WebdriverIO.MochaOpts; error?: any  }> {
        var capabilities: Record<string, any> = {
            platformName: this.data['os'],
            'appium:udid': this.data['udid'],
            'appium:deviceName': this.data['udid'],
            'appium:newCommandTimeout': 50000,
            'appium:noReset': this.data['no_reset'],
            'headspin:capture.video': true,
            'headspin:capture.network': true,
            // 'appium:autoLaunch':this.data['autolaunch']
        };
        if (this.data['os']==='android') {
            capabilities['appium:appPackage'] = this.data['packages'];
            capabilities['appium:appActivity'] = this.data['activity'];
            capabilities['appium:automationName'] = "UiAutomator2";
        }
        else if (this.data['os']==='ios') {
            capabilities['appium:bundleId'] = this.data['packages'];
            capabilities['appium:automationName'] = "XCUITest";
        }
        // console.log(capabilities)
        LogInfo(`${capabilities}`)
        const url = new URL(this.data['appium-url']);
        const options: RemoteOptions = {
            hostname: url.hostname,
            port: Number(url.port), 
            path: url.pathname,
            capabilities,
            protocol: url.protocol.replace(':', ''),
            logLevel: 'error',
            connectionRetryCount: 0      
        };
        try {
            const driver = await remote(options);
            this.data['driver'] = driver
            this.data['sessionId'] = driver.sessionId
            this.data['kpi'] = kpi
            return { code: 200, driver };
        } catch (error) {
            LogError(`Error creating WebDriver: ${error}`);
            return { code: 500, error }; 
        }   
    }


    get_value(name: string,types:string):number {
        let result = this.data['sensitivity']?.[name]?.[types];
        return Number(result) 
    }


}