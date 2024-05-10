import { useState} from "react"
import throttle from "lodash.throttle";
import {formatBytes} from "../../../../utils"
import PropTypes from 'prop-types';  

function Sent({message}) {
    let [File_Downloading, set_File_Downloading]=useState(false);
    let [Downloaded, set_Downloaded]=useState(null);
    let M_Date="";
    let M_Time="";
    if(message.Created_At)
    {
        const TimeStamp=new Date(message.Created_At.seconds * 1000);
        M_Date = ((TimeStamp.getDate()).toString().padStart(2, "0") + "/" + (TimeStamp.getMonth() +1).toString().padStart(2, "0") + "/" + TimeStamp.getFullYear());
        M_Time = ((TimeStamp.getHours()).toString().padStart(2, "0") + ":" + (TimeStamp.getMinutes()).toString().padStart(2, "0") );
    }
    /////////// Throttling to reduce reloads////////////////////
    let Update_Progress=throttle((value)=>{
        set_Downloaded(value);
    },200, {Leading:true, trailing: true}) 

    async function Handle_File_Download(Message)
    {
        set_File_Downloading(true);
        const Response= await fetch(Message.Download_URL);
        if(!Response.body) return;
        const Reader= Response.body.getReader();
        let Total_Size= Response.headers.get("Content-Length");
        Total_Size =  typeof Total_Size === "string" ? parseInt(Total_Size) : Total_Size;
        let chunks=[];
        let Length=0;
        while(true)
        {
            const {done, value} = await Reader.read();
            if(done) break;
            chunks.push(value);
            Length=Length + value.length;
            Update_Progress(parseFloat((Length / Total_Size).toFixed(2)) * 100)
        }
        let blob=new Blob(chunks)
        let tempUrl=URL.createObjectURL(blob);
        let a=document.createElement("a");
        a.href= tempUrl;
        a.download=Message.Name.split("_")[0] ;
        document.body.appendChild(a);
        a.click();
        a.remove();
        set_File_Downloading(false);
    }
  return (
    <div className="w-full flex mt-4 justify-end gap-2 relative left-0">
        <div className="  h-full min-w-[170px] max-w-[320px]  text-wrap leading-1.5 p-2 rounded-se-xl rounded-s-xl bg-slate-900">
            <div className="text-sm overflow-hidden font-semibold max-w-[320px] text-wrap py-2.5 text-gray-100 " style={{ overflowWrap: 'break-word' }}>                      
                { message && message.Message.Type ? 
                    <>
                        {!(message.Message.Type === "png" ||
                            message.Message.Type === "jpg" ||  
                            message.Message.Type === "jpeg" || 
                            message.Message.Type === "gif" || 
                            message.Message.Type === "webp" ||
                            message.Message.Type === "svg" || 
                            message.Message.Type === "mp4" || 
                            message.Message.Type === "mov" ||
                            message.Message.Type === "avi" ||  
                            message.Message.Type === "wmv" ||  
                            message.Message.Type === "webmmkv" 
                        ) ?
                            <div className=" w-full h-full flex flex-col items-start my-2.5 bg-gray-600 rounded-xl p-2">
                                <div className="w-full flex flex-row justify-between items-center">
                                    <div>
                                        {message.Message.Name.split(".")[0] ?
                                            message.Message.Name.split(".")[0]
                                            :
                                            message.Message.Name
                                        }
                                    </div>
                                    <div className=" ml-1 inline-flex self-center items-center">
                                        {
                                            !File_Downloading ?
                                                <a 
                                                    href="#"
                                                    onClick={()=>Handle_File_Download(message.Message)}
                                                    className="inline-flex self-center items-center p-2 text-sm font-medium text-center  rounded-lg focus:ring-4 focus:outline-none text-whitbg-gray-600 hover:bg-gray-500 focus:ring-gray-600 cursor-pointer">
                                                    <svg className="w-4 h-4 text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                                                        <path d="M14.707 7.793a1 1 0 0 0-1.414 0L11 10.086V1.5a1 1 0 0 0-2 0v8.586L6.707 7.793a1 1 0 1 0-1.414 1.414l4 4a1 1 0 0 0 1.416 0l4-4a1 1 0 0 0-.002-1.414Z"/>
                                                        <path d="M18 12h-2.55l-2.975 2.975a3.5 3.5 0 0 1-4.95 0L4.55 12H2a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2Zm-3 5a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z"/>
                                                    </svg>    
                                                </a>
                                            :
                                                <span
                                                    className="inline-flex self-center items-center p-2 text-sm font-medium text-center  rounded-lg focus:ring-4 focus:outline-none text-whitbg-gray-600 hover:bg-gray-500 focus:ring-gray-600 cursor-pointer"
                                                >
                                                    {
                                                        Downloaded && Downloaded + "%"
                                                    }
                                                </span>
                                                
                                        }
                                    </div>
                                </div>
                                <div className="  pr-3 flex justify-between w-full text-xs font-normal text-gray-400 gap-2">
                                    {
                                        formatBytes(message.Message.Size)
                                    }
                                    <div className="flex">
                                        {
                                            message.Message.Type
                                        }
                                    </div>
                                </div>
                                
                            </div>
                            :
                            <div className="grid gap-4 grid-cols- my-2.5">
                                <div className="group relative">
                                    <div className="absolute z-10 top-0 right-2/4 bg-gray-900/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full flex items-center justify-center">
                                        {    !File_Downloading ?
                                                <button 
                                                    onClick={()=>Handle_File_Download(message.Message)}
                                                    data-tooltip-target="download-image-1" className="inline-flex items-center justify-center rounded-full h-8 w-8 bg-white/30 hover:bg-white/50 focus:ring-4 focus:outline-none text-white focus:ring-gray-50">
                                                    <svg className="w-4 h-4 text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 16 18">
                                                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 1v11m0 0 4-4m-4 4L4 8m11 4v3a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2v-3"/>
                                                    </svg>
                                                </button>
                                            :
                                            <span
                                                className="inline-flex self-center items-center p-2 text-sm font-medium text-center  rounded-lg focus:ring-4 focus:outline-none text-whitbg-gray-600 bg-gray-500 focus:ring-gray-600 cursor-pointer opacity-100"
                                            >
                                                {
                                                    Downloaded && Downloaded + "%"
                                                }
                                            </span>

                                        }
                                    </div>
                                    {
                                        (
                                            message.Message.Type === "mp4" || 
                                            message.Message.Type === "mov" ||
                                            message.Message.Type === "avi" ||  
                                            message.Message.Type === "wmv" ||  
                                            message.Message.Type === "webmmkv" 
                                        ) ?
                                        <>
                                            <video controls src={message.Message.Download_URL} className="rounded-lg min-h-[170px] max-h-[320px]  min-w-[170px] max-w-[320px] "> 
                                            </video>
                                            <div className=" mt-5 min-w-[170px] max-w-[320px] pr-5 flex justify-between w-full text-xs font-normal text-gray-400 gap-2">
                                                {
                                                    formatBytes(message.Message.Size)
                                                }
                                                <div className="flex">
                                                    {
                                                        message.Message.Type
                                                    }
                                                </div>
                                            </div>
                                        </>

                                        :
                                        <>
                                            <img src={message.Message.Download_URL} className="rounded-lg min-h-[170px] max-h-[320px]  min-w-[170px] max-w-[320px] " />
                                            <div className=" mt-5 min-w-[170px] max-w-[320px]  pr-6 flex justify-between w-full text-xs font-normal text-gray-400 gap-2">
                                                {
                                                    formatBytes(parseInt(message.Message.Size))
                                                }
                                                <div className="flex">
                                                    {
                                                        message.Message.Type
                                                    }
                                                </div>
                                            </div>
                                        </>

                                    }
                                </div>
                            </div>
                        }
                    </>
                    :
                        message.Message 
                }
            </div>
            
            <div className=" flex justify-between">
                <span className="text-sm font-normal text-gray-500 ">
                        {message && M_Date
                        }
                </span>
                <span className="text-sm font-normal text-gray-500 flex  ">
                    {message &&
                        M_Time
                    }
                    <div className=" ml-2">
                        {
                            message && message.Read ? 
                                <span className="text-sm font-normal text-green-500 "><i className="fa fa-check"></i> </span>
                            :
                                <span className="text-sm font-normal text-gray-100 "><i className="fa fa-check"></i> </span>

                        }
                    </div>
                </span>
            </div>
        </div>
            
    </div>
  )
}
Sent.propTypes={
	message:PropTypes.shape({
		Sender_ID:PropTypes.string,
		Sender_Id:PropTypes.string,
		Created_At:PropTypes.object,
		Message:PropTypes.oneOfType([
			PropTypes.string,
			PropTypes.object
		]),
		Read:PropTypes.bool
	})
}
export default Sent