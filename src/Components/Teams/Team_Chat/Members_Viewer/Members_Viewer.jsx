import { useState , useEffect, useContext } from "react"
import { Database_Context } from "../../../../App"
import firebase from "firebase/compat/app";
import PropTypes from 'prop-types';  

function Members_Viewer({set_View_Members,Opened_Team}) {
    let [Team_Members,set_Team_Members]=useState(null);
    let [Local_Team_Memebers,set_Local_Team_Memebers]=useState(Opened_Team.Members);
    let [Loading_Members,set_Loading_Members]=useState(null);
    let [Removing_Member,set_Removing_Member]=useState(false);
    let {auth,firestore}=useContext(Database_Context);

    useEffect(()=>{
        firestore.collection("Teams").where("TID","==",Opened_Team.TID).onSnapshot((Snap)=>{
            set_Local_Team_Memebers(Snap.docs[0].data().Members);
        })
    },[])

    useEffect(()=>{
        set_Loading_Members(true);
        Opened_Team.Created_By && Local_Team_Memebers.push(Opened_Team.Created_By)
        Local_Team_Memebers && Promise.all(
            Local_Team_Memebers.map((member)=>{
                return firestore.collection("Users").where("UID","==",member).get().then((Query)=>{
                    return Query.docs[0].data();
                })
            })
        ).then((Users)=>{
            set_Team_Members([...Users]);
            set_Loading_Members(false);
        })
    },[Local_Team_Memebers])
	
    function Remove_Member(UID)
    {
        set_Removing_Member(true);
        firestore.collection("Teams").where("TID","==",Opened_Team.TID).get().then((Res)=>{
            Res.docs[0].ref.update({
                Members: firebase.firestore.FieldValue.arrayRemove(UID)
            }).then(()=>{
                set_Local_Team_Memebers(Local_Team_Memebers.filter(mem=> mem !== UID));
                set_Removing_Member(false);
            })
        })
    }
  return (  
    <div className='absolute w-full h-full bg-slate-600  bg-opacity-60 flex items-center justify-center z-50 rounded-lg' >
        <div id="crud-modal" tabIndex="1" aria-hidden="true" className="  z-50 justify-center items-center w-full md:inset-0 ">
            <div className="relative p-4 w-full max-h-full flex items-center justify-center ">
                <div className="relative bg-gray-900 rounded-md">
                    <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t border-gray-600">
                        <h3 className=" mr-4 text-lg font-semibold text-white">
                            Memebers
                        </h3>
                        <button
                            onClick={()=>set_View_Members(false)}
                            type="button" className="text-gray-400 bg-transparent rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center hover:bg-gray-600 hover:text-white" data-modal-toggle="crud-modal">
                            <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/>
                            </svg>
                            <span className="sr-only">Close modal</span>
                        </button>
                    </div>
                <div className="p-2 md:p-3" >
                { !Loading_Members && Team_Members && 
                    Team_Members.map((usr)=>{
                        return(
                            <>
                                    <div className="flex items-center ps-2 px-2 py-1 rounded hover:bg-gray-600 ">
                                        <img src={usr.photoUrl} alt="avatar" className="relative inline-block object-cover object-center w-8 h-8 rounded-full" />
                                        <div className="w-full py-2 ms-2 text-sm font-medium rounded text-gray-300 flex">
                                            {usr.Name}
                                            {
                                                usr.UID ===  Opened_Team.Created_By &&
                                                    <p className=" ml-2 text-slate-500">(Lead)</p>
                                            }
                                        </div>
                                        {
                                            auth.currentUser.uid === Opened_Team.Created_By && !Removing_Member &&  usr.UID !==  Opened_Team.Created_By &&
                                                <button
                                                    onClick={()=>Remove_Member(usr.UID)}
                                                    type="button" className="text-red-400 bg-transparent hover:text-red-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center cursor-pointer" data-modal-toggle="crud-modal">
                                                    <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                                                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/>
                                                    </svg>
                                                </button>
                                        }
                                    </div>
                            </>
                        )
                    })
                }
                </div>
                </div>
            </div>
        </div>
    </div>
  )
}
Members_Viewer.propTypes={
    set_View_Members:PropTypes.func,
    Opened_Team:PropTypes.object
}
export default Members_Viewer