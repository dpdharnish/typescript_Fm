/*-------------------------------------------------------------------------------------------------------------------------*/
/*-------------------------------------------- TypeDefinations ------------------------------------------------------------*/
/*-------------------------------------------------------------------------------------------------------------------------*/
export type Data = {
    [key: string]: any;
}

export type ParsedArgs =  {
    appium_input: string;
    udid: string;
    os: string;
}

type KpiInnerDictionary = {
    start: number|null;
    end: number|null;
    start_sensitivity?:number|null;
    end_sensitivity?:number|null;
    segment_start?:number|null;
    segment_end?:number|null;
    time?:number
}   

export type KpiDictionary =  {
    [key: string]: KpiInnerDictionary;
}