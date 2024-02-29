/*-------------------------------------------------------------------------------------------------------------------------*/
/*-------------------------------------------- import librarys ------------------------------------------------------------*/
/*-------------------------------------------------------------------------------------------------------------------------*/
import { Data } from './types'
import  HsApi from './hsapi'
import { LogInfo, LogError } from './logger';

/*-------------------------------------------------------------------------------------------------------------------------*/
/*-------------------------------------------- SessionVisualLib class ------------------------------------------------------------*/
/*-------------------------------------------------------------------------------------------------------------------------*/
export default class SessionVisualLib {
    data: Data = {}; 
    HsApiobj: HsApi;

    constructor(data: Data) {
        this.data = data;
        this.data['access_token'] = this.get_access_token(this.data['appium-url']);
        this.HsApiobj = new HsApi(this.data['access_token'],'')
    }
    
    async run_record_session_info() {  
        LogInfo('run_record_session_info') 
        await this.run_add_annotation_data(); 
        await this.run_add_session_data();
    }

    async run_add_annotation_data() {
        LogInfo('run_add_annotation_data') 
        await this.get_video_start_timestamp();
        await this.add_kpi_labels();
    }

    async run_add_session_data() {
        LogInfo('run_add_session_data') 
        var session_data:any = await this.get_general_session_data();
        await  this.HsApiobj.add_session_data(session_data);
        var description:string="";
        for (const entry of session_data.data) {
            const key: string = entry.key.toString();
            const value: string = entry.value.toString();
            description += key + " : " + value + ",\n";
        }
        await  this.HsApiobj.update_session_name_and_description(description,this.data['sessionId'],this.data['test_name']);
        await  this.HsApiobj.add_session_tags(this.data['sessionId'],session_data.data);

    }

    async get_general_session_data() {
        LogInfo('get_general_session_data') 
        if (this.data['status'] === 'Passed'){
            var status:string = 'Passed'
        } 
        else {
            var status:string = 'Failed'
        }
        var session_data:any = {
            "session_id":this.data['sessionId'],
            "status":status,
            "test_name":this.data['test_name'],
            "data":[
                {'key':'status','value':status},
                {'key':'fail_reason','value':this.data['fail_reason']},
                {'key':'app_version','value':''}
            ]
        }
        for (const kpiName in this.data.kpi){
            const kpiData = this.data.kpi[kpiName];
            if ('time' in this.data.kpi[kpiName]) {
                session_data.data.push({'key':kpiName,'value':this.data.kpi[kpiName]['time']});
            }
        }
        return session_data
    }

    async get_video_start_timestamp(): Promise<void> {
        LogInfo('get_video_start_timestamp') 
        const wait_until_capture_complete: boolean = true;
        const durationInSeconds: number = 600; // 600 seconds or 10 minutes
        const endTimeMillis: number = Date.now() + durationInSeconds * 1000; // 9.12
        if (wait_until_capture_complete) {
            while (Date.now() < endTimeMillis) {
                const capture_timestamp: any = await  this.HsApiobj.get_capture_timestamp(this.data['sessionId']);
                if ("capture-complete" in capture_timestamp) {
                    this.data['video_start_time'] = capture_timestamp["capture-started"];
                    this.data['video_end_time'] = capture_timestamp["capture-ended"];
                    break;
                }
            }
        }
    } 

    async add_kpi_labels() {
        LogInfo('add_kpi_labels') 
        for (const kpiName in this.data.kpi) {
            const kpiData = this.data.kpi[kpiName];
            var label_start_time:number;
            var label_end_time:number;
            if (kpiData.start>0 && kpiData.end) {
                label_start_time = kpiData['start']-this.data['video_start_time']*1000 
                label_end_time = kpiData['end']-this.data['video_start_time']*1000
                await  this.HsApiobj.add_label(this.data['sessionId'],kpiName,"desired region",label_start_time,label_end_time);
                LogInfo(` ${kpiName}: label id add for the desired region`) 
                var start_sensitivity = 0.835;
                var end_sensitivity = 0.975;
                var video_box = 0;
                if ('start_sensitivity' in kpiData) {
                    start_sensitivity =kpiData['start_sensitivity']
                }
                if ('end_sensitivity' in kpiData) {
                    end_sensitivity =kpiData['end_sensitivity']
                }
                if ('video_box' in kpiData) {
                    video_box = kpiData['video_box']
                }
                var new_label_start_time:number = label_start_time;
                var new_label_end_time:number = label_end_time;
                if (false) {

                }
                else {
                    if (('start' in kpiData) && ('end' in kpiData)){
                        const response: any = await this.HsApiobj.get_pageloadtime(this.data['sessionId'],kpiName,label_start_time,label_end_time,start_sensitivity,end_sensitivity,video_box);
                        LogInfo(` ${kpiName}: label id add for the pageload`) 
                        if (!response.page_load_regions[0]?.error_msg) {
                            new_label_start_time = response.page_load_regions[0]?.start_time;
                            new_label_end_time = response.page_load_regions[0]?.end_time;
                            this.data.kpi[kpiName]['time'] = new_label_end_time-new_label_start_time
                            await this.HsApiobj.add_label(this.data['sessionId'],kpiName,this.data['kpi_category'],new_label_start_time,new_label_end_time);
                            LogInfo(` ${kpiName}: label id add for the ${this.data['kpi_category']}`) 
                        }
                    }
                }
            }
        }
    }

    get_access_token(url:string):string {
        LogInfo('get_access_token') 
        const urlObject = new URL(url);
        const pathSegments = urlObject.pathname.split('/');
        const accessToken = pathSegments[pathSegments.length - 3];
        if (accessToken) {
            return accessToken;
        } else {
            throw new Error('Access token not found in the URL');
        }
    }
}