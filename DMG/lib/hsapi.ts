/*-------------------------------------------------------------------------------------------------------------------------*/
/*-------------------------------------------- import librarys ------------------------------------------------------------*/
/*-------------------------------------------------------------------------------------------------------------------------*/
import axios, { AxiosResponse } from 'axios';
import { LogInfo, LogError } from './logger';

/*-------------------------------------------------------------------------------------------------------------------------*/
/*--------------------------------------------- Headspin API class --------------------------------------------------------*/
/*-------------------------------------------------------------------------------------------------------------------------*/

export default class HsApi {
    auth:{username:string,password:string};
    base_url = ""

/*--------------------------------------------- constructor ---------------------------------------------------------------*/

    constructor(username:string,password:string) {
        this.auth = {
            username: username,
            password: password
        }
        this.base_url = "https://api-dev.headspin.io/v0/"
    }
/*--------------------------------------------- get_capture_timestamp -------------------------------------------------------*/

    async get_capture_timestamp(SessionId:String): Promise<Record<string, any> | null> {
        const requestUrl = `${this.base_url}sessions/${SessionId}/timestamps`;
        try {
            const response = await axios.get(requestUrl, { auth: this.auth });
            if (response.status === 200) {
                return response.data as Record<string, any>;
            } else {
                return null;
            }
        } catch (error) {
            LogError(`${error}`)
            return null;
        }
    }

/*--------------------------------------------- add_label ---------------------------------------------------------------------*/

    async add_label(SessionID:string,LabelName:string,Category:string,S_time:number,E_time:number):Promise<any | null> {
        const requestUrl = `${this.base_url}sessions/${SessionID}/label/add`;
        const dataPayload = {
            name: LabelName,
            category: Category,
            start_time: S_time.toString(),
            end_time: E_time.toString(),
            data: null,
            pinned: false,
            label_type: 'user',
        };
        try {
            const response: AxiosResponse = await axios.post(requestUrl, dataPayload, { auth: this.auth });
            if (response.status === 200) {
                return response.data;
            } else {
                return null;
            }
        } catch (error) {
            LogError(`${error}`)
            return null;
        }
    }

/*--------------------------------------------- get_pageloadtime -----------------------------------------------------------------*/

    async get_pageloadtime(SessionId: string,kpiName:string,label_start_time:number,label_end_time:number,start_sensitivity:number,end_sensitivity:number,video_box:number):Promise<any | null> {
        const requestUrl=`${this.base_url}sessions/analysis/pageloadtime/${SessionId}`;
        const dataPayload = {
            regions: [
                {
                    start_time: label_start_time.toString(),
                    end_time: label_end_time.toString(),
                    name: kpiName
                }
            ],
            start_sensitivity: start_sensitivity,
            end_sensitivity: end_sensitivity,
        };
        try {
            const response: AxiosResponse = await axios.post(requestUrl, dataPayload, { auth: this.auth });

            if (response.status === 200) {
                return response.data;
            } else {
                LogError(`HTTP Request failed with response code: ${response.status}`)
                return null; 
            }
        } catch (error) {
            LogError(`${error}`)
            return null; 
        }

    }

/*--------------------------------------------- add_session_data -----------------------------------------------------------------------*/

    async add_session_data(session_data: any | null) {
        const requestUrl = `${this.base_url}perftests/upload`;
        try {
            const response: AxiosResponse = await axios.post(requestUrl, session_data, { auth: this.auth });
            if (response.status === 200) {
                return response.data;
            } else {
                LogError(`HTTP Request failed with response code: ${response.status}`)
                return null; 
            }
        } catch (error) {
            LogError(`${error}`)
            return null; 
        }
    }

/*--------------------------------------------- update_session_name_and_description -------------------------------------------------------*/

    async update_session_name_and_description(data:string,sessionId:string,testname:string): Promise<string | null> {
        const requestUrl: string = `${this.base_url}sessions/${sessionId}/description`;
        try {
            const dataPayload: { [key: string]: string } = {
                "name": testname,
                "description": data
        }
        const response: AxiosResponse = await axios.post(requestUrl, dataPayload, { auth: this.auth });

            if (response.status === 200) {
                return response.data;
            } else {
                LogError(`HTTP Request failed with response code: ${response.status}`)
                return null; 
            }
        } catch (error) {
            LogError(`${error}`)
            return null;
        }     
    }

/*--------------------------------------------- add_session_tags ---------------------------------------------------------------------------*/

    async add_session_tags(session_id:string,data: { key: string; value: string | number }[]) {
        const requestUrl: string = `${this.base_url}sessions/tags/${session_id}`;
        const tagsPayload = {
            tags: data.map(tag => ({ [tag.key]: tag.value }))
        };
        try {
            const response: AxiosResponse = await axios.post(requestUrl, tagsPayload, { auth: this.auth });

            if (response.status === 200) {
                return response.data;
            } else {
                LogError(`HTTP Request failed with response code: ${response.status}`)
                return null; 
            }
        } catch (error) {
            LogError(`${error}`)
            return null;
        }
    }
}
