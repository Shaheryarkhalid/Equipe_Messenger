import { useState,useContext, useEffect } from "react";
import { Database_Context } from "../../../App";
import firebase from "firebase/compat/app";
import Responsive_Loader from "../../Loading/Responsive_Loader";
import PropTypes from 'prop-types';  
import { v4 } from "uuid";

function Create_Team({set_Create_Team_Popup_Modal})
{
    let [Select_Team,set_Select_Team]=useState(false);
    let [Team_Name,set_Team_Name]=useState("");
    let [Team_Objective,set_Team_Objective]=useState("");
    let [Team_Members,set_Team_Members]=useState([]);
    let [Error_Log,set_Error_Log]=useState("");
    let [Friends,set_Friends]=useState([]); 
    let [Loading_Friends,set_Loading_Friends]=useState(false);
    let [Adding_Team,set_Adding_Team]=useState(false);
    let {firestore,auth}=useContext(Database_Context);

    useEffect(()=>{ 
        set_Loading_Friends(true);
        firestore.collection("Users").where("UID","==",auth.currentUser.uid).get().then((QuerySnap)=>{
            Promise.all(
                QuerySnap.docs[0].data().Friends.map((friend)=>{
                    return firestore.collection("Users").where("UID","==",friend).get().then((Query)=>{
                        return Query.docs[0].data();
                    })
                })
            ).then((Users)=>{
                set_Friends([...Users]);
                set_Loading_Friends(false);
            })
        })
    },[])

    function Check_Team_Name()
    {
        if(Team_Name==="")
        {
            set_Error_Log("Team name cannot be empty.")
            return false;
        }else if(Team_Name.length < 4)
        {
            set_Error_Log("Team Name Must be atleast 4 characters long.");
            return false;
        }
        set_Error_Log("");
        return true;
    }
    function Check_Team_Objective()
    {
        if(Team_Objective==="")
        {
            set_Error_Log("Team objective cannot be empty.")
            return false;
        }else if(Team_Objective.length < 4)
        {
            set_Error_Log("Team objective Must be atleast 4 characters long.");
            return false;
        }
        set_Error_Log("");
        return true;
    }
    function Handle_Add_User(UID)
    {
        Team_Members.includes(UID)? set_Team_Members(()=> Team_Members.filter((a)=>a!== UID)) : set_Team_Members((prev)=>[...prev, UID]);
    }
    function HandleTeamSubmit(e)
    {
        e.preventDefault();
        set_Adding_Team(true);
        if(Check_Team_Name() && Check_Team_Objective())
        {
            firestore.collection("Teams").add({
                TID:""+v4(),
                Name:Team_Name,
                Objective:Team_Objective,
                Members:Team_Members,
                Created_By:auth.currentUser.uid,
                Photo_URL:"https://t3.ftcdn.net/jpg/05/16/27/58/360_F_516275801_f3Fsp17x6HQK0xQgDQEELoTuERO4SsWV.jpg",
                Created_At:firebase.firestore.FieldValue.serverTimestamp()
            }).then(()=>{
                set_Team_Name("");
                set_Team_Objective("");
                set_Team_Members([]);
                set_Create_Team_Popup_Modal(false);
                set_Adding_Team(false);
            })
        }else{
            set_Adding_Team(false);
        }
    }   

    return (
        <div className='absolute w-full h-full bg-slate-600  bg-opacity-60 flex items-center justify-center overflow-auto' >
            <div id="crud-modal" tabIndex="1" aria-hidden="true" className=" z-50 justify-center items-center w-full md:inset-0 ">
                <div className="relative p-4 w-full max-h-full flex items-center justify-center ">
                    <div className="relative bg-gray-900 rounded-md">
                        <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t border-gray-600">
                            <h3 className="text-lg font-semibold text-white">
                                Create New Team
                            </h3>
                            <button
                                onClick={()=>set_Create_Team_Popup_Modal(false)}
                                type="button" className="text-gray-400 bg-transparent  rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center hover:bg-gray-600 hover:text-white" data-modal-toggle="crud-modal">
                                <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/>
                                </svg>
                                <span className="sr-only">Close modal</span>
                            </button>
                        </div>
                        <form className="p-4 md:p-5" onSubmit={HandleTeamSubmit} action="#">
                            <div className="grid gap-4 mb-4 grid-cols-2">
                                <div className="col-span-2">
                                    <label htmlFor="name" className="block mb-2 text-sm font-medium text-white">Team Name</label>
                                    <input type="text" name="name"
                                            value={Team_Name}
                                            onChange={(e)=>set_Team_Name(e.target.value)}
                                            onBlur={Check_Team_Name}
                                            id="name" className=" border  text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 bg-gray-600 border-gray-500 placeholder-gray-400 text-white focus:ring-primary-500 focus:border-primary-500" placeholder="Type team name" required="" />
                                </div>
                                <div className="col-span-2 sm:col-span-1">
                                    <label htmlFor="Objective" className="block mb-2 text-sm font-medium text-white">Objective</label>
                                    <input type="text" name="Objective"
                                            value={Team_Objective}
                                            onChange={(e)=>set_Team_Objective(e.target.value)}
                                            onBlur={Check_Team_Objective}
                                            id="Objective" className=" border  text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 bg-gray-600 border-gray-500 placeholder-gray-400 text-white focus:ring-primary-500 focus:border-primary-500" placeholder="Team's Objective" required="" />
                                </div>
                                <div className="col-span-2 sm:col-span-1 relative">
                                    <label htmlFor="category" className="block mb-2 text-sm font-medium text-white">Add Team Members</label>
                                    
                                    <button id="dropdownSearchButton" 
                                            onClick={()=>set_Select_Team(!Select_Team)}
                                            data-dropdown-toggle="dropdownSearch" data-dropdown-placement="bottom" className="  focus:ring-4 focus:outline-none  font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center bg-gray-600 border-gray-500 placeholder-gray-400 text-white focus:ring-primary-500 focus:border-primary-500" type="button"> Select Team Members
                                            <svg className="w-2.5 h-2.5 ms-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4"/>
                                            </svg>
                                    </button>
                                    
                                    {
                                        Select_Team && 
                                            <div  id="dropdownSearch" className="absolute left-0 mt-3 py-2 z-10 rounded-lg shadow w-56 bg-gray-700">
                                                <div className="p-3">
                                                <label htmlFor="input-group-search" className="sr-only">Search</label>
                                                <div className="relative">
                                                    <div className="absolute inset-y-0 rtl:inset-r-0 start-0 flex items-center ps-3 pointer-events-none">
                                                    <svg className="w-4 h-4 text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                                                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"/>
                                                    </svg>
                                                    </div>
                                                    <input 
                                                        onChange={(e)=>Friends.length > 0 && set_Friends([...Friends.filter(friend=>friend.Name.toLowerCase().includes(e.target.value.toLowerCase()))].concat([...Friends.filter(friend=>!friend.Name.toLowerCase().includes(e.target.value.toLowerCase().toLowerCase()))]))}
                                                        autoComplete="off"
                                                        type="text" id="input-group-search" className="block w-full p-2 ps-10 text-sm  rounded-lg  focus:ring-blue-500 focus:border-blue-500 bg-gray-600 border-gray-500 placeholder-gray-400 text-white" placeholder="Search user" />
                                                </div>
                                                </div>
                                                <ul className=" h-32 px-3 pb-3 overflow-y-auto text-sm text-gray-200" aria-labelledby="dropdownSearchButton">
                                                    {
                                                        Loading_Friends && 
                                                        <Responsive_Loader />
                                                    }
                                                    { !Loading_Friends && 
                                                        Friends.map((usr)=>{
                                                            return(
                                                                <>
                                                                    <li className=" cursor-pointer">
                                                                        <div className="flex items-center ps-2 py-1 rounded hover:bg-gray-600 cursor-pointer">
                                                                            <input  id={usr.UID}
                                                                                    onChange={()=>Handle_Add_User(usr.UID)}
                                                                                     checked={Team_Members.includes(usr.UID)? true:false}
                                                                                    type="checkbox" value="" className="w-3 h-3 mr-2 text-blue-600 focus:ring-blue-600 ring-offset-gray-700 focus:ring-offset-gray-700 focus:ring-2 bg-gray-600 border-gray-500 cursor-pointer"/>
                                                                    
                                                                            <img src={usr.photoUrl} alt="avatar" className="relative inline-block object-cover object-center w-8 h-8 rounded-full cursor-pointer" />
                                                                            <label htmlFor={usr.UID} className="w-full py-2 ms-2 text-sm font-medium rounded text-gray-300 cursor-pointer">
                                                                                {usr.Name}
                                                                            </label>
                                                                        </div>
                                                                    </li>
                                                                </>
                                                            )
                                                        })
                                                    }
                                            
                                                </ul>
                                            </div>
                                    }
                                </div>
                               <span className="col-span-2 text-center text-red-500">{Error_Log}</span>
                            </div>
							<button disabled={Adding_Team}  type="submit" className="text-white inline-flex disabled:cursor-not-allowed items-center focus:ring-4 focus:outline-none font-medium rounded-lg text-sm px-5 py-2.5 text-center bg-blue-600 hover:bg-blue-700 focus:ring-blue-800">
								{
									Adding_Team ? 
										<svg aria-hidden="true" className=" w-4 h-4 mr-3 animate-spin text-white fill-blue-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/><path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/></svg>
										:
										<svg className="me-1 -ms-1 w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd"></path></svg> 
								}
								Add Team
							</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}
Create_Team.propTypes={
    set_Create_Team_Popup_Modal:PropTypes.func
}
export default Create_Team