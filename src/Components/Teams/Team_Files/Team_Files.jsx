import {useState, useEffect, useContext, useRef } from "react";
import { Database_Context } from "../../../App";
import { useCollectionData } from "react-firebase-hooks/firestore";
import Shared_Files from "../Shared_Files/Shared_Files";
import Responsive_Loader from "../../Loading/Responsive_Loader";
import PropTypes from 'prop-types';  

function Team_Files({Opened_Team}) {

    let [Messages,set_Messages]=useState(null);
    let [All_Messages,set_All_Messages]=useState(null);
    let [Older_Messages,set_Older_Messages] =useState(null);
    let [Messages_Count,set_Messages_Count]=useState(-10);
    let [is_ALL,setis_ALL]=useState(false);
    let Scroll_Older_Messages=useRef(null);
    let viewScrollerFiles = useRef(); 
    let {firestore}=useContext(Database_Context);
    let [Result]=useCollectionData(firestore.collection("Team_Chat").where("Team_ID","==",Opened_Team.TID));

    useEffect(()=>{
        if(Result && Result.length > 0)
        {
            let Sorted_Messages = Result.sort((x, y)=>{
                if(x.Created_At && y.Created_At)
                {
                    return (new Date(x.Created_At.seconds)  > new Date(y.Created_At.seconds) ? 1: -1);
                }else{
                    return -1;
                }
            })
            Sorted_Messages=Sorted_Messages.filter(a=>a.Message.Type);
            set_All_Messages(Sorted_Messages);
            set_Messages(Sorted_Messages.slice(-10));
        } else if(Result && Result.length === 0){
            set_Messages([]);
        }
    },[Result]);

    useEffect(()=>{
        setTimeout(()=>{
            viewScrollerFiles.current && viewScrollerFiles.current.scrollIntoView({behavior: "smooth"});
        },700)
    },[Messages])

    let  prevScrollHeight =useRef();
    useEffect(()=>{
        if(prevScrollHeight.current)
        {
            const { scrollHeight } = Scroll_Older_Messages.current;
            const newMessagesHeight = scrollHeight - prevScrollHeight.current;
            Scroll_Older_Messages.current.scrollTop = newMessagesHeight;
        }
    },[Older_Messages])

    useEffect(()=>{
        set_Messages(null);
        set_All_Messages(null);
        set_Older_Messages(null);
        set_Messages_Count(-20);
        setis_ALL(false)
        prevScrollHeight.current=null;
    },[Opened_Team]);

    function Handle_Scroll_Older_Messages()
    {
        const { scrollTop, scrollHeight } = Scroll_Older_Messages.current;
        if((scrollTop === 0) && (All_Messages.length >= Math.abs(Messages_Count)))
        {
            if(All_Messages.length > Math.abs(Messages_Count - 10))
            {
                set_Older_Messages(All_Messages.slice(Messages_Count, -10));
                set_Messages_Count(Messages_Count - 10);
            }else{
                let x=Math.abs(All_Messages.length - Math.abs(Messages_Count));
                set_Older_Messages(All_Messages.slice(Messages_Count, -10));
                set_Messages_Count(Messages_Count - x);
            }
            prevScrollHeight.current = scrollHeight;
        }else if(All_Messages.length <= Math.abs(Messages_Count)){
            setis_ALL(true);
        }
    }

  return (
    <>
     <div 
           ref={Scroll_Older_Messages}
           onScroll={Handle_Scroll_Older_Messages} 
        className="w-full h-full  bg-slate-700 overflow-auto p-1 flex flex-col items-center rounded-md ">
            {
                    is_ALL && 
                    <span className=" w-3/5 p-3 bg-slate-400 self-center text-gray-200 rounded-lg text-center">That&apos;s all. </span>
                }
            
                { Older_Messages &&
                    Older_Messages.map((message)=>{
                        return(
                            <Shared_Files key={message.id} message={message} />
                        )
                    })
                }
            {!Messages && <Responsive_Loader />  }
            {
                Messages &&  Messages.length === 0 && 
                <div key={"Teste"} className="w-full h-full flex items-center justify-center">
                    <span className=" text-slate-200">Be the first one to share files.</span>
                </div>
            }
            {Messages&&   Messages.length !== 0 &&
                Messages.map((message)=>{
                    return(
                                <Shared_Files key={message.id} message={message} />
                    )
                })
            }
            <div ref={viewScrollerFiles}  className="mt-7" >

            </div>
        </div>
    </>
  )
}
Team_Files.propTypes={
    Opened_Team:PropTypes.object
}
export default Team_Files