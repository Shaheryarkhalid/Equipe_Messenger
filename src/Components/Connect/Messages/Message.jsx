import { useContext, useEffect, useRef, useState } from "react";
import { Database_Context } from "../../../App";
import firebase from "firebase/compat/app";
import { Timestamp } from "firebase/firestore";
import {  ref, uploadBytes, getDownloadURL} from "firebase/storage";
import { useCollectionData } from "react-firebase-hooks/firestore";
import Recieved from "./Recieved/Recieved";
import Sent from "./Sent/Sent";
import Responsive_Loader from "../../Loading/Responsive_Loader";
import Image_Viewer from "./Image_Viewer/Image_Viewer";
import EmojiPicker from "emoji-picker-react";
import { v4 } from "uuid";
import PropTypes from 'prop-types';  

function Message({Opened_Contact,set_Opened_Contact}) {
    let [Chat,set_Chat]=useState("");
    let [Message_Type,set_Message_Type]=useState("");
    let [Messages,set_Messages]=useState(null);
    let [All_Messages,set_All_Messages]=useState(null);
    let [Older_Messages,set_Older_Messages] =useState(null);
    let [Messages_Count,set_Messages_Count]=useState(-20);
    let [is_ALL,setis_ALL]=useState(false);
    let [Uploading, set_Uploading]=useState(false);
    let [Open_Image,set_Open_Image]=useState(false);
    let [Emoji_Picker,set_Emoji_Picker]=useState(false);
    
    let Scroll_Older_Messages=useRef(null);
    let  prevScrollHeight =useRef();
    
    let {auth,firestore,StorageBuck}=useContext(Database_Context);

    let Sent_Query=firestore.collection("Messages").where("Sender_Id","==",auth.currentUser.uid).where("Reciever_Id","==",Opened_Contact);
    let Recieved_Query=firestore.collection("Messages").where("Sender_Id","==",Opened_Contact).where("Reciever_Id","==",auth.currentUser.uid);
    
    let [Sent_Messages]=useCollectionData(Sent_Query);
    let [Recieved_Messages]=useCollectionData(Recieved_Query);
    let viewScroller = useRef(); 

    useEffect(()=>{
        if(Sent_Messages || Recieved_Messages)
        {
            let Mess;
            if(Sent_Messages && Recieved_Messages)
            {
                Mess=Sent_Messages.concat(Recieved_Messages);
            }else if(Sent_Messages)
            {
                Mess=Sent_Messages;
            }else{
                Mess=Recieved_Messages;
            }
            Mess.sort((x, y)=>{
                if(x.Created_At && y.Created_At)
                {
                    return (new Date(x.Created_At.seconds)  > new Date(y.Created_At.seconds) ? 1: -1);
                }else{
                    return -1;
                }
            })
            set_All_Messages(Mess)
            let x= Mess.slice(-10);
            set_Messages(x);
            firestore
            .collection("Messages")
            .where("Sender_Id","==",Opened_Contact)
            .where("Reciever_Id","==",auth.currentUser.uid)
            .where("Read","==",false).get().then((Query)=>{
                Query.docs.map((val)=>{
                    val.ref.update({
                        Read: true
                    })
                })
            })
        }
    },[Sent_Messages, Recieved_Messages])
    
    useEffect(()=>{
        viewScroller.current && viewScroller.current.scrollIntoView({behavior: "smooth"});
    },[Messages])
    
    useEffect(()=>{
        set_Messages(null);
        set_All_Messages(null);
        set_Older_Messages(null);
        set_Messages_Count(-20);
        set_Chat("");
        setis_ALL(false)
        prevScrollHeight.current=null;
        firestore.collection("Users").where("UID","==", Opened_Contact).get().then((QuerySnap)=>{
            set_Chat(QuerySnap.docs[0].data());
        })
        firestore
            .collection("Messages")
            .where("Sender_Id","==",Opened_Contact)
            .where("Reciever_Id","==",auth.currentUser.uid)
            .where("Read","==",false).get().then((Query)=>{
                Query.docs.map((val)=>{
                    val.ref.update({
                        Read: true
                    })
                })
            });

    },[Opened_Contact]);

    useEffect(()=>{
        if(prevScrollHeight.current)
        {
            const { scrollHeight } = Scroll_Older_Messages.current;
            const newMessagesHeight = scrollHeight - prevScrollHeight.current;
            Scroll_Older_Messages.current.scrollTop = newMessagesHeight;
        }
    },[Older_Messages])

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
            Read:false,
            Reciever_Id:Opened_Contact,
            Sender_Id:auth.currentUser.uid,
            Created_At: firebase.firestore.FieldValue.serverTimestamp()
        };
        firestore.collection("Messages").add(obj).then(()=>{
        })
        Handle_Latest_Chat_Update();
    }
    function Handle_Latest_Chat_Update()
    {
        firestore.collection("Last_Chat").where("User_ID","==",auth.currentUser.uid).get().then((result)=>{
            if(result.docs.length > 0)
            { 
                result.docs[0].ref.update({
                    Chats:  firebase.firestore.FieldValue.arrayUnion({
                            Chat_User: Opened_Contact,
                            Created_At: Timestamp.now()
                    })
                }).then(()=>{
                    firestore.collection("Last_Chat").where("User_ID","==",auth.currentUser.uid).get().then((res)=>{
                        let chats=res.docs[0].data().Chats;
                        chats.sort((a,b)=>{return new Date(a.Created_At.seconds) - new Date(b.Created_At.seconds)})
                        let new_Chats=[];
                        let AllUsers=[];
                        chats.map((value)=>{
                            if(!AllUsers.includes(value.Chat_User))
                            {
                                new_Chats.push(value);
                                AllUsers.push(value.Chat_User);
                            }else{
                                new_Chats =new_Chats.map((val)=>(val.Chat_User === value.Chat_User && (value.Created_At.seconds > val.Created_At.seconds) ) ? value : val)
                            }
                        });
                        res.docs[0].ref.update({
                            Chats:  new_Chats
                        });
                    })
                })
            }else{
                let obj={
                    User_ID : auth.currentUser.uid,
                    Chats: [
                        {
                            Chat_User:Opened_Contact,
                            Created_At:Timestamp.now()
                        }
                    ]
                }
                firestore.collection("Last_Chat").add(obj);
            }
        })
        firestore.collection("Last_Chat").where("User_ID","==",Opened_Contact).get().then((result2)=>{
            if(result2.docs.length > 0)
            {
                result2.docs[0].ref.update({
                    Chats:  firebase.firestore.FieldValue.arrayUnion({
                                Chat_User: auth.currentUser.uid,
                                Created_At: Timestamp.now()
                            })
                }).then(()=>{
                    firestore.collection("Last_Chat").where("User_ID","==",Opened_Contact).get().then((res)=>{
                        let chats=res.docs[0].data().Chats;
                        chats.sort((a,b)=>{return new Date(a.Created_At.seconds) - new Date(b.Created_At.seconds)})
                        let new_Chats=[];
                        let AllUsers=[];
                        chats.map((value)=>{
                            if(!AllUsers.includes(value.Chat_User))
                            {
                                new_Chats.push(value);
                                AllUsers.push(value.Chat_User);
                            }else{
                                new_Chats =new_Chats.map((val)=>(val.Chat_User === value.Chat_User && (value.Created_At.seconds > val.Created_At.seconds) ) ? value : val)
                            }
                        });
                        res.docs[0].ref.update({
                            Chats:  new_Chats
                        });
                    })
                    
                })
            }else{
                let obj={
                    User_ID :Opened_Contact,
                    Chats: [
                        {
                            Chat_User: auth.currentUser.uid,
                            Created_At:Timestamp.now()
                        }
                    ]
                }
                firestore.collection("Last_Chat").add(obj);
            }
            
        });

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
                        Read:false,
                        Reciever_Id:Opened_Contact,
                        Sender_Id:auth.currentUser.uid,
                        Created_At: firebase.firestore.FieldValue.serverTimestamp()
                    };
                    firestore.collection("Messages").add(Message).then(()=>{
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
                        Read:false,
                        Reciever_Id:Opened_Contact,
                        Sender_Id:auth.currentUser.uid,
                        Created_At: firebase.firestore.FieldValue.serverTimestamp()
                    };
                    firestore.collection("Messages").add(Message).then(()=>{
                        set_Uploading(false);   
                    })
                })
             });
        })
    }
    function Handle_Unfriend(UID,e)
    {
        e.target.style.display="none";
        firestore.collection("Users").where("UID", "==" , UID).get().then((Query)=>{
            let friend=Query.docs[0];
            friend.ref.update({
                Friends: firebase.firestore.FieldValue.arrayRemove(auth.currentUser.uid)
            }).then(()=>{
                firestore.collection("Users").where("UID", "==", auth.currentUser.uid).get().then((QuerySnap)=>{
                    QuerySnap.docs[0].ref.update({
                        Friends: firebase.firestore.FieldValue.arrayRemove(UID)
                    }).then(()=> set_Opened_Contact(null));

                })
            });
        });
    }

    return (
        <>      
            { Open_Image && 
                <Image_Viewer set_Open_Image={set_Open_Image} Open_Image={Open_Image} />
            }  
            <div className="w-full h-[15%] shadow-[0.2px_0px_1px_1px]  shadow-slate-600  bg-slate-800  text-gray-100 rounded-t-xl flex items-center">
                <div className="flex items-center gap-4 py-2 px-4 w-4/6">
                    { !Chat &&
                        <Responsive_Loader />

                    }
                    {Chat &&
                        <>
                            <img src={Chat.photoUrl} alt="avatar"
                                onClick={(e)=>set_Open_Image(Chat.photoUrl,e)}
                                className="relative inline-block object-cover object-center w-12 h-12 rounded-lg cursor-pointer" />
                            <div>
                                <h6 className="block font-sans text-base antialiased font-semibold leading-relaxed tracking-normal text-inherit">
                                    {Chat.Name}
                                </h6>
                                <p className="block font-sans text-sm antialiased font-normal leading-normal text-gray-400">
                                    {
                                        Chat.Email
                                    }
                                </p>
                            </div>
                        </>
                    }
                </div>
                <div className="w-2/6 h-full flex items-center justify-evenly relative">
                    <a href={"/Voice_Call?Target="+ Opened_Contact} target="_blank"  className=" h-9 w-9 border-2 border-slate-200 rounded-lg flex items-center justify-center cursor-pointer hover:scale-105 hover:border-slate-700 transition-all"><i className="fa fa-phone text-xl"></i></a>
                    <a href={"/Video_Call?Target="+ Opened_Contact} target="_blank" className=" h-9 w-9 border-2 border-slate-200  rounded-lg flex items-center justify-center cursor-pointer hover:scale-105 hover:border-slate-700 transition-all"><i className="fa fa-video-camera text-xl"></i></a>
                    <a onClick={(e)=>Handle_Unfriend(Chat.UID,e)} className=" h-9 w-9 border-2 border-red-500  rounded-lg flex items-center justify-center cursor-pointer   text-red-500 hover:text-red-600  hover:scale-105 hover:border-slate-700 transition-all"><i className="fas fa-user-times"></i></a>
                 </div>
            </div>
            <div 
                ref={Scroll_Older_Messages}
                onScroll={Handle_Scroll_Older_Messages} 
                className="w-full h-[75%] bg-slate-500 overflow-auto p-4 flex flex-col">
                {
                    is_ALL && 
                    <span className=" w-3/5 p-3 bg-slate-400 self-center text-gray-200 rounded-lg text-center">That&apos;s all of your chat. </span>
                }
            
                { Older_Messages &&
                    Older_Messages.map((message)=>{
                        return(
                            message.Sender_Id == auth.currentUser.uid ? (
                                <>
                                    <Sent key={message.Sender_Id} message={message} />

                                </>
                            )
                            :
                                <Recieved key={message.Sender_Id} message={message} />
                        )
                    })
                }
                {!Messages &&
                    <Responsive_Loader />
                }
                {
                  Messages &&  Messages.length === 0 && 
                  <div key={"Teste"} className="w-full h-full flex items-center justify-center">
                    <span>Be the first one to start the conversation 🤒..</span>
                  </div>
                }
                {Messages&&   Messages.length !== 0 &&
                    Messages.map((message)=>{
                        return(
                            message.Sender_Id == auth.currentUser.uid ?
                                   <Sent key={message.id} message={message} />
                            :
                                <Recieved key={message.id} message={message} />
                        )
                    })
                }
                <div ref={viewScroller}  >
                </div>
            </div>
            <div className="w-full h-[10%] px-3 rounded-b-md shadow-sm shadow-slate-500  bg-slate-800  flex items-center justify-evenly relative">
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
                                type="file" multiple  accept = "image/*" className="fa fa-paperclip text-2xl cursor-pointer hidden" />

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
Message.propTypes={
    Opened_Contact:PropTypes.string,
    set_Opened_Contact:PropTypes.func
}
export default Message