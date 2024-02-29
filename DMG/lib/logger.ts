/*-------------------------------------------------------------------------------------------------------------------------*/
/*---------------------------------------- Logger Functions ---------------------------------------------------------------*/
/*-------------------------------------------------------------------------------------------------------------------------*/
function logWithDateTime(data: string, color: string) {
    const currentDateTime = new Date();
    const formattedDateTime = `${currentDateTime.toLocaleDateString()} ${currentDateTime.toLocaleTimeString()}`;
    const resetColor = '\x1b[0m';
    console.log(`${color}[${formattedDateTime}] ${data}${resetColor}`);
}

export function LogInfo(message: string | number) {
    logWithDateTime(`[INFO] ${message}`, '\x1b[32m'); 
}

export function LogError(message: string | number) {
    logWithDateTime(`[ERROR] ${message}`, '\x1b[31m'); 
}