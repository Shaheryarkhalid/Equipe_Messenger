import { useState, useContext, useEffect } from "react"
import firebase from "firebase/compat/app";
import { Database_Context } from "../../../App";
import Responsive_Loader from "../../Loading/Responsive_Loader";

function Connection_Request() {
    let [Request_Open,set_Request_Open]=useState(false);
    let {auth, firestore} = useContext(Database_Context);
    let [Loading_Requests,set_Loading_Requests]=useState(false);
    let [Loading_Action,setLoading_Action]=useState(false);
    let [Error_Log, set_Error_Log]=useState("");
    let [Requests,setRequests]=useState([]);
    let [User,Set_User] = useState(); 
    useEffect(()=>{
        firestore.collection("Users").where("UID","==", auth.currentUser.uid).onSnapshot((Snap)=>{
            Set_User(Snap.docs[0].data());
        })
    },[])
    function Handle_Requests()
    {
        if(Request_Open)
        {
            return
        }
        set_Loading_Requests(true);
        let Rqtuser=[];
        firestore.collection("Users").where("UID","==", auth.currentUser.uid).get().then((QuerySnap)=>{
            let Invites=QuerySnap.docs[0].data().Recieved_Invites;
            if(Invites.length === 0)
            {
                set_Error_Log("No Invites to Show.")
                set_Loading_Requests(false);
            }
            Invites.map((usr)=>{
                firestore.collection("Users").where("UID","==",usr).get().then((Query)=>{
                    setRequests([...Rqtuser,Query.docs[0].data()]);
                    Rqtuser.push(Query.docs[0].data());
                    set_Loading_Requests(false);
                })
            });
        });
    }
    function Accept_Invite(UID)
    {
        setLoading_Action(true);
        firestore.collection("Users").where("UID","==",auth.currentUser.uid).get().then((QuerySnap)=>{
            const document = QuerySnap.docs[0];
            document.ref.update({
                Friends: firebase.firestore.FieldValue.arrayUnion(UID),
                Sent_Invites: firebase.firestore.FieldValue.arrayRemove(UID),
                Recieved_Invites: firebase.firestore.FieldValue.arrayRemove(UID)
            })
        })  
        firestore.collection("Users").where("UID","==",UID).get().then((QuerySnap)=>{
            const document = QuerySnap.docs[0];
            document.ref.update({
                Friends: firebase.firestore.FieldValue.arrayUnion(auth.currentUser.uid),
                Sent_Invites: firebase.firestore.FieldValue.arrayRemove(auth.currentUser.uid),
                Recieved_Invites: firebase.firestore.FieldValue.arrayRemove(auth.currentUser.uid)
            }).then(()=>{
                setLoading_Action(false);
                setRequests(Requests.filter((val)=> val.UID!==UID));
            })
        })  
    }
    function Reject_Invite(UID)
    {
        setLoading_Action(true);
        firestore.collection("Users").where("UID","==",auth.currentUser.uid).get().then((QuerySnap)=>{
            const document = QuerySnap.docs[0];
            document.ref.update({
                Sent_Invites: firebase.firestore.FieldValue.arrayRemove(UID),
                Recieved_Invites: firebase.firestore.FieldValue.arrayRemove(UID)
            })
        })  
        firestore.collection("Users").where("UID","==",UID).get().then((QuerySnap)=>{
            const document = QuerySnap.docs[0];
            document.ref.update({
                Sent_Invites: firebase.firestore.FieldValue.arrayRemove(auth.currentUser.uid),
                Recieved_Invites: firebase.firestore.FieldValue.arrayRemove(auth.currentUser.uid)
            }).then(()=>{
                setLoading_Action(false);
                setRequests(Requests.filter((val)=> val.UID!==UID));
            })
        })  
    }
    return (
        <div className="w-full flex flex-col items-center justify-center p-2 bg-gray-700 rounded-md relative" >
            <button onClick={()=>{set_Request_Open(!Request_Open); Handle_Requests()}}  id="dropdownUsersButton" data-dropdown-toggle="dropdownUsers" data-dropdown-placement="bottom" className="text-white focus:ring-4 focus:outline-none font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center bg-blue-600 hover:bg-blue-700 focus:ring-blue-800 relative" type="button">
               {
                User && User.Recieved_Invites && User.Recieved_Invites.length > 0 &&
                    <>
                        { User.Recieved_Invites.length > 99 ? 
                                <span className=" h-5 w-5 rounded-full bg-red-400 text-slate-300 absolute -right-1 -top-1">99+</span>
                            :
                             <span className=" h-5 w-5 rounded-full bg-red-400 text-slate-300 absolute -right-1 -top-1">{User.Recieved_Invites.length}</span>

                        }
                    </>
               }
                Requests to Connect 
                {
                    !Loading_Requests?
                    <svg className="w-2.5 h-2.5 ms-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4"/>
                        </svg>
                    :
                    <svg aria-hidden="true" className=" cursor-not-allowed w-4 h-4 ml-2 animate-spin text-gray-600 fill-white " viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/><path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
                        </svg>
                }
            </button>
               { Request_Open && Error_Log &&
                    <span  className=" mt-4 text-red-500"> {Error_Log} </span> 
               }
             { Request_Open && Requests.map((usr)=>{
                    return(
                    <div key={usr.UID} className="w-full"  >
                        <div className=" mt-5 py-3 px-1 w-full hover:bg-slate-800 transition-all rounded-md ">
                        <div className="w-full flex items-center justify-center gap-4 pr-5 select-none  ">
                            <img src={usr.photoUrl}  alt="avatar"
                            className="relative inline-block object-cover object-center w-12 h-12 rounded-lg" />
                            <div>
                            <h6 className="block font-sans text-white text-base antialiased font-semibold leading-relaxed tracking-normal text-inherit">
                                {usr.Name}
                            </h6>
                            <p className=" max-w-[130px] truncate block font-sans text-sm antialiased font-normal leading-normal text-gray-400">
                                {usr.Email}
                            </p>
                            </div>
                            <button
                            className=" absolute right-5 p-0.5 mb-2 me-2 overflow-hidden text-sm font-medium  rounded-lg group">
                                    <span className="relative flex items-center  justify-center transition-all ease-in duration-75">
                                        
                                    </span>
                            </button> 
                        </div>
                        <div className=" mt-3 w-full flex items-center justify-evenly">
                            {
                                Loading_Action ?
                                    <Responsive_Loader />
                                :
                                <>
                                    <span
                                        onClick={()=>Accept_Invite(usr.UID)}
                                        className=" p-1 px-4 bg-slate-900 rounded-md text-sm  text-white cursor-pointer  hover:scale-105 transition-all">
                                        Accept
                                        <i className="fa fa-user-check text-xs pl-2"></i>
                                    </span>

                                    <span
                                        onClick={()=>Reject_Invite(usr.UID)}
                                        className=" p-1 px-4 bg-slate-900 rounded-md text-sm text-red-600 cursor-pointer  hover:scale-105 transition-all">
                                        Reject
                                        <i className="fa fa-user-xmark text-xs pl-2"></i>
                                    </span>
                                </>
                            }
                        </div>
                        </div>  
                    </div>
                 )
                })
            }

            
        </div>
    )
}

export default Connection_Request