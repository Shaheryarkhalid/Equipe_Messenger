import { useState, useRef, useEffect, useContext } from "react";
import { Database_Context } from "../../../App";
import firebase from "firebase/compat/app";
import { uploadBytes, ref,getDownloadURL } from "firebase/storage";
import { useCollectionData } from "react-firebase-hooks/firestore";
import Responsive_Loader from "../../Loading/Responsive_Loader";
import Recieved from "../../Connect/Messages/Recieved/Recieved";
import Sent from "../../Connect/Messages/Sent/Sent";
import Add_Member from "./Add_Member/Add_Member";
import Members_Viewer from "./Members_Viewer/Members_Viewer";
import Image_Viewer from "../../Connect/Messages/Image_Viewer/Image_Viewer";
import EmojiPicker from "emoji-picker-react";
import { v4 } from "uuid";
import PropTypes from 'prop-types';  


function Team_Chat({Opened_Team, set_Opened_Team}) {
    let [Message_Type,set_Message_Type]=useState("");
    let [Messages,set_Messages]=useState(null);
    let [All_Messages,set_All_Messages]=useState(null);
    let [Older_Messages,set_Older_Messages] =useState(null);
    let [Messages_Count,set_Messages_Count]=useState(-10);
    let [is_ALL,setis_ALL]=useState(false);
    let [Add_Member_Toogle,set_Add_Member_Toogle]=useState(false);
    let [View_Members,set_View_Members]=useState(false);
    let [Uploading, set_Uploading]=useState(false);
    let [Open_Image,set_Open_Image]=useState(false);
    let [Emoji_Picker,set_Emoji_Picker]=useState(false);
    let [Changing_Team_Image,set_Changing_Team_Image]=useState(false);
    let [Temp_Image,set_Temp_Image]=useState();
    let Scroll_Older_Messages=useRef(null);
    let viewScroller = useRef(); 
    let {auth,firestore,StorageBuck}=useContext(Database_Context);
    // let [Result,set_Result]=useState();
    let [Result]=useCollectionData(firestore.collection("Team_Chat").where("Team_ID","==",Opened_Team.TID));

    useEffect(()=>{
        if(Result && Result.length > 0)
        {
            let Sorted_Messages=  Result.sort((x, y)=>{
                if(x.Created_At && y.Created_At)
                {
                    return (new Date(x.Created_At.seconds)  > new Date(y.Created_At.seconds) ? 1: -1);
                }else{
                    return -1;
                }
            })
            set_All_Messages(Sorted_Messages);
            set_Messages(Sorted_Messages.slice(-10));
            firestore.collection("Team_Chat").where("Team_ID","==",Opened_Team.TID).get().then((Chats)=>{
                Chats.docs.map((ch)=>{
                    ch.data().Read_By && !ch.data().Read_By.includes(auth.currentUser.uid) && ch.ref.update({
                        Read_By: firebase.firestore.FieldValue.arrayUnion(auth.currentUser.uid)
                    })
                })
            })
        } else if(Result && Result.length === 0){
            set_Messages([]);
        }
    },[Result])

    useEffect(()=>{
        viewScroller.current && viewScroller.current.scrollIntoView({behavior: "smooth"});
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

    function Handle_Submit_Message(e)
    {
        e.preventDefault();
        set_Emoji_Picker(false);
        if(Message_Type === "")
        {
            return;
        }
        set_Message_Type("");
        const obj={
            Message:Message_Type,
            Team_ID:Opened_Team.TID,
            Sender_ID:auth.currentUser.uid,
            Read_By:[auth.currentUser.uid],
            Created_At: firebase.firestore.FieldValue.serverTimestamp()
        };
        firestore.collection("Team_Chat").add(obj).then(()=>{
        })
    }
    function Handle_File_Upload(e)
    {   
        if(e.target.files[0])
        {
            set_Uploading(true);   
            let file=e.target.files[0]
            const fileRef=ref(StorageBuck, file.name.split(".")[0] +  "_" + v4()+ "." + file.name.split(".")[1]);
            uploadBytes(fileRef, file).then((File_Data)=>{
                getDownloadURL(File_Data.ref).then((url)=>{
                    let File_Message={
                        Name: File_Data.metadata.fullPath.split("_")[0] + "." + File_Data.metadata.fullPath.split(".")[1],
                        Download_URL: url,
                        Type: File_Data.metadata.fullPath.split(".")[1] ,
                        Size: File_Data.metadata.size  
                    }
                    const Message={
                        Message:File_Message,
                        Team_ID:Opened_Team.TID,
                        Sender_ID:auth.currentUser.uid,
                        Read_By:[auth.currentUser.uid],
                        Created_At: firebase.firestore.FieldValue.serverTimestamp()
                    };
                    firestore.collection("Team_Chat").add(Message).then(()=>{
                        set_Uploading(false);
                    })
                });
            })
        }
    }

    function Handle_Media_Upload(e)
    {
        if(e.target.files.length > 10)
        {
            alert("Maximum Allowed limit is 10");
            return;
        }
        set_Uploading(true);   
        let File_Message=[];
        [...e.target.files].map((file)=>{
            const fileRef=ref(StorageBuck, file.name.split(".")[0] +  "_" + v4()+ "." + file.name.split(".")[1]);
            uploadBytes(fileRef, file).then((File_Data)=>{
                getDownloadURL(File_Data.ref).then((url)=>{
                    File_Message={
                        Name: File_Data.metadata.fullPath.split("_")[0] + "." + File_Data.metadata.fullPath.split(".")[1],
                        Download_URL: url,
                        Type: File_Data.metadata.fullPath.split(".")[1] ,
                        Size: File_Data.metadata.size  
                    }
                    const Message={
                        Message:File_Message,
                        Team_ID:Opened_Team.TID,
                        Sender_ID:auth.currentUser.uid,
                        Read_By:[auth.currentUser.uid],
                        Created_At: firebase.firestore.FieldValue.serverTimestamp()
                    };
                    firestore.collection("Team_Chat").add(Message).then(()=>{
                        set_Uploading(false);   
                    })
                })
             });
        })
    }
    function Leave_Team()
    {
        firestore.collection("Teams").where("TID","==",Opened_Team.TID).get().then((result)=>{
            result.docs[0].ref.update({
                Members:firebase.firestore.FieldValue.arrayRemove(auth.currentUser.uid),
            })
            result.docs[0].data().Created_By === auth.currentUser.uid && result.docs[0].ref.update({
                Created_By: ""
            })
            set_Opened_Team(null);
        })
    }
    function Handle_Team_Image_Change(e)
    {
        set_Changing_Team_Image(true);
        if(e.target.files[0])
            {
            let file=e.target.files[0]
            const fileRef=ref(StorageBuck, file.name.split(".")[0] +  "_" + v4()+ "." + file.name.split(".")[1]);
            uploadBytes(fileRef, file).then((File_Data)=>{
                getDownloadURL(File_Data.ref).then((url)=>{
                    firestore.collection("Teams").where("TID","==",Opened_Team.TID).get().then((QuerySnap)=>{
                        QuerySnap.docs[0].ref.update({
                            Photo_URL:url
                        })
                        set_Changing_Team_Image(false);
                        firestore.collection("Teams").where("TID","==",Opened_Team.TID).get().then(() => {
                            set_Temp_Image(url);
                        })
                    })
                })
            })
        }
    }
  return (
    <>
        { Add_Member_Toogle &&    <Add_Member set_Add_Member_Toogle={set_Add_Member_Toogle} Opened_Team={Opened_Team} />}
        { View_Members && <Members_Viewer set_View_Members={set_View_Members} Opened_Team={Opened_Team} />}
        { Open_Image && <Image_Viewer set_Open_Image={set_Open_Image} Open_Image={Open_Image} /> } 
        <div className="w-full h-[15%] rounded-t-xl shadow-[0.2px_0px_1px_1px] shadow-slate-600  bg-slate-800  text-gray-100 flex items-center">    
            <div className="flex items-center gap-4 py-2 px-4 w-4/6">
                { !Opened_Team && <Responsive_Loader />}
                {Opened_Team &&
                    <>
                        <div className=" max-w-12">
                            {
                                
                                !Changing_Team_Image ? 
                                    <>
                                        {Opened_Team && Opened_Team.Created_By === auth.currentUser.uid ?
                                            <label htmlFor="Team_Image" className="inline-block relative object-cover object-center w-12 h-12 rounded-lg p-0.5 cursor-pointer" >
                                                    <img src={Temp_Image ? Temp_Image : Opened_Team.Photo_URL} 
                                                        alt="avatar"
                                                        className="object-cover w-full h-full rounded-md" />
                                            </label>
                                            :
                                            <img src={Opened_Team.Photo_URL} 
                                                onClick={()=>set_Open_Image(Opened_Team.Photo_URL)}
                                                alt="avatar"
                                                className="object-cover w-12 h-12 rounded-md cursor-pointer" />
                                        }
                                    </>
                                :
                                <Responsive_Loader />
                            }
                        </div>
                        <input
                         onChange={Handle_Team_Image_Change}
                         id="Team_Image" type="file" accept="image/*" className="hidden" />
                        
                        <div>
                            <h6 className="block font-sans text-base antialiased font-semibold leading-relaxed tracking-normal text-inherit">
                                {Opened_Team.Name}
                                {
                                    Opened_Team && Opened_Team.Created_By === auth.currentUser.uid && 
                                        <span className=" ml-2 text-xs text-slate-400" >(Creator)</span>
                                }
                            </h6>
                            <p className="block font-sans text-sm antialiased font-normal leading-normal text-gray-400">
                                {Opened_Team.Objective}
                            </p>
                        </div>
                    </>

                }
                
            </div>
            <div className="w-2/6 h-full flex items-center justify-evenly relative">
                <a onClick={()=>set_View_Members(true)} className=" h-10 w-10 border-2 border-slate-200  rounded-lg flex items-center justify-center cursor-pointer hover:scale-105 hover:border-slate-700 transition-all"><i className="fa fa-user-group text-xl"></i></a>
                {
                    auth.currentUser.uid === Opened_Team.Created_By &&
                    <a onClick={()=>set_Add_Member_Toogle(true)} className=" h-10 w-10 border-2 border-slate-200 rounded-lg flex items-center justify-center cursor-pointer hover:scale-105 hover:border-slate-700 transition-all"><i className="fa fa-user-plus text-xl"></i></a>
                }
                <a onClick={()=>Leave_Team()}className=" h-10 w-10 border-2 border-red-500  rounded-lg flex items-center justify-center cursor-pointer  text-red-500 hover:text-red-600  hover:scale-105 hover:border-slate-700 transition-all"><i className="fa fa-sign-out"></i></a>
                
                
            </div>
        </div>
        <div 
            ref={Scroll_Older_Messages}
            onScroll={Handle_Scroll_Older_Messages} 
            className="w-full h-[75%] bg-slate-500 overflow-auto p-4 flex flex-col ">
            {
                    is_ALL && 
                    <span className=" w-3/5 p-3 bg-slate-400 self-center text-gray-200 rounded-lg text-center">That&apos;s all of your chat. </span>
                }
            
                { Older_Messages &&
                    Older_Messages.map((message)=>{
                        return(
                            message.Sender_ID == auth.currentUser.uid ? (
                                <>
                                    <Sent key={message.id} message={message} />

                                </>
                            )
                            :
                                <Recieved key={message.id} message={message} />
                        )
                    })
                }
            {!Messages &&
                <Responsive_Loader />
            }
            {
                Messages &&  Messages.length === 0 && 
                <div key={"Teste"} className="w-full h-full flex items-center justify-center">
                <span className=" text-slate-200">Be the first one to start the conversation 🤒..</span>
                </div>
            }
            {Messages&&   Messages.length !== 0 &&
                Messages.map((message)=>{
                    return(
                        message.Sender_ID == auth.currentUser.uid ?
                                <Sent key={message.id} message={message} />
                        :
                            <Recieved key={message.id} message={message} />
                    )
                })
            }
            <div ref={viewScroller} className="mt-4"  >

            </div>
        </div>
        <div className="w-full h-[10%] px-3 rounded-b-md shadow-sm shadow-slate-500  bg-slate-800 flex items-center justify-evenly relative">
            <div className="h-full flex items-center">
                <i
                onClick={()=>set_Emoji_Picker(!Emoji_Picker)}
                className="fa fa-smile text-3xl cursor-pointer text-yellow-500 hover:text-yellow-700 px-3"></i>
                {
                    Emoji_Picker &&
                    <div className=" absolute bottom-full" >
                        <EmojiPicker onEmojiClick={({emoji})=>set_Message_Type(Message_Type + emoji)} />
                    </div>
                }
            </div>
            <div className="h-full w-5/6 flex items-center relative">
                <form onSubmit={Handle_Submit_Message} action=""  className="h-full w-full flex items-center relative" > 
                    <input
                        value={Message_Type}
                        onChange={(e)=>set_Message_Type(e.target.value)}
                        onFocus={()=>set_Emoji_Picker(false)}
                        type="text" className="w-full h-4/6 px-4 pr-12 rounded-xl focus:outline-green-500" />
                    
                    <button type="submit"  className="fa fa-paper-plane text-xl absolute right-4 cursor-pointer"></button>
                </form>
            </div>
            <div className="h-full flex items-center overflow-hidden">
                { Uploading ?
                    <div className=" w-32 h-32">
                        <Responsive_Loader />
                    </div>
                :
                    <div className="text-2xl flex">
                        <input id="File_Upload" onChange={Handle_File_Upload} type="file" className="fa fa-paperclip text-2xl cursor-pointer hidden " />
                        <button
                            onClick={()=>   document.getElementById("File_Upload").click()}
                            >
                            <i className="fa fa-paperclip  cursor-pointer px-2 text-slate-400 hover:text-slate-700"></i>
                        </button>

                        <input id="Media_Upload" onChange={Handle_Media_Upload}

                            type="file" multiple accept="image/*" className="fa fa-paperclip text-2xl cursor-pointer hidden" />
                        <button
                            onClick={()=>   document.getElementById("Media_Upload").click()}
                            >
                            <i className="fas fa-photo-video text-xl cursor-pointer px-2 text-slate-400 hover:text-slate-500"></i>
                        </button>
                    </div>
                }
                
            </div>
        </div>
    </>
  )
}
Team_Chat.propTypes={
    Opened_Team:PropTypes.object,
    set_Opened_Team:PropTypes.func
}
export default Team_Chat