import {useState, useEffect, useContext} from 'react'
import { useNavigate } from 'react-router-dom';
import { Database_Context } from '../../App';
import { View_Context } from '../../App';
import { signOut } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import {useCollectionData} from "react-firebase-hooks/firestore"
import Create_Team from './Create_Team/Create_Team';
import Teams_Display from './Teams_Display/Teams_Display';
import Team_Chat from './Team_Chat/Team_Chat';
import Team_Files from "./Team_Files/Team_Files"
import Responsive_Loader from '../Loading/Responsive_Loader';
import { v4 } from 'uuid';

function Teams() {
	let [Create_Team_Popup_Modal,set_Create_Team_Popup_Modal] =useState(false);
	let [Opened_Team,set_Opened_Team]=useState("");
  let [Uploading_Profile,set_Uploading_Profile]=useState(false);
	let {firestore,auth,StorageBuck}=useContext(Database_Context);
	let {Left_Drawer,set_Left_Drawer}=useContext(View_Context);
	let [Unsorted_Created_Teams]=useCollectionData(firestore.collection("Teams").where("Created_By","==",auth.currentUser.uid));
	let [Unsorted_Member_of_Teams]=useCollectionData(firestore.collection("Teams").where("Members","array-contains",auth.currentUser.uid));
	let navigate=useNavigate();
	let [Chat,set_Chat]=useState();

	useEffect(()=>{
		Opened_Team ? set_Left_Drawer(false): set_Left_Drawer(true);
	},[Opened_Team])
  
	useEffect(()=>{
		let Temp=[]
		let Has_Chat=[]
		let Without_Chat=[];
		let Latest=0;  
		if(Unsorted_Created_Teams && Unsorted_Created_Teams.length > 0 ) Temp = Temp.concat(Unsorted_Created_Teams);
		if(Unsorted_Member_of_Teams && Unsorted_Member_of_Teams.length > 0 ) Temp = Temp.concat(Unsorted_Member_of_Teams);
		Temp.length > 0 && Temp.map((team)=>{
		firestore.collection("Team_Chat").where("Team_ID","==",team.TID).orderBy("Created_At", "desc").limit(1).onSnapshot((chat)=>{
			if(chat.docs[0])
			{
			let x=new Date(chat.docs[0].data().Created_At.seconds * 1000);
			if(x > Latest)
			{
				Latest=x;
				Has_Chat.unshift(team);
			}else{
				Has_Chat.push(team);
			}
			}else{
			Without_Chat.push(team);
			}
			set_Chat([...new Set(Has_Chat.concat(Without_Chat))]);
		})
		})
		
	},[Unsorted_Created_Teams,Unsorted_Member_of_Teams])

  function Handle_Profile_Image_Change(e)
  {
      set_Uploading_Profile(true);
      if(e.target.files[0])
          {
          let file=e.target.files[0]
          const fileRef=ref(StorageBuck, file.name.split(".")[0] +  "_" + v4()+ "." + file.name.split(".")[1]);
          uploadBytes(fileRef, file).then((File_Data)=>{
              getDownloadURL(File_Data.ref).then((url)=>{
                  auth.currentUser.updateProfile({ photoURL: url }).then(()=> {
                       firestore.collection("Users").where("UID","==",auth.currentUser.uid).get().then((QuerySnap)=>{
                           QuerySnap.docs[0].ref.update({
                               photoUrl:url
                           })
                           set_Uploading_Profile(false);
                       })
                  })
              });
          })
      }
  }
	function Sign_Out()
	{
		signOut(auth).then(() => {
			navigate("/");
		}).catch((error) => {
			alert(error);
		});
	}
  return (
    <div className='h-[calc(100vh-96px)] w-full flex justify-evenly items-center bg-slate-800 relative'>
        
        <div className= { (Left_Drawer ?  "flex ": "hidden") + " absolute top-0 left-0 z-20 md:relative w-full h-[98%]  md:w-[20%] pt-3  bg-slate-900 overflow-auto shadow-xl rounded-lg md:flex flex-col items-center"}>
          
          <div className='w-full h-full px-3 flex flex-col items-center'>
            <button
              onClick={()=>set_Create_Team_Popup_Modal(true)}
              type="button" className= " w-full text-white focus:ring-4 mt-3 focus:ring-blue-300 font-medium rounded-lg text-md px-5 py-2.5 me-2 mb-2 bg-blue-700 hover:bg-blue-800 focus:outline-nonefocus:ring-blue-800">Create Team</button>
            
            {!Chat && 
              <Responsive_Loader />
            }
            {Chat && Chat.length>0 &&
              <>
                <span className=' sticky top-0 text-white bg-slate-700 w-full text-center py-3 rounded-b-none rounded-md z-10'>Teams</span>
                <div className=' h-5/6  w-full mt-0 flex flex-col items-center justify-start bg-slate-800 rounded-md overflow-auto rounded-t-none'>
                  {Chat && Chat.map((team)=>{
                      return(
                        <>
                          <Teams_Display team={team}  set_Opened_Team={set_Opened_Team} Opened_Team={Opened_Team}  />
                        </>
                      )
                  })
                  }
                </div>
              </>
            }
            <div className={ " pt-5 w-3/4 md:hidden  bg-slate-900  rounded-md flex items-center justify-center"}>
                <div className=" h-full flex flex-row items-center">
                    {
                        Uploading_Profile ? <Responsive_Loader /> :
                            <label htmlFor="Profile_Image" className="inline-block relative object-cover object-center w-12 h-12 rounded-lg border-2 border-green-500 p-0.5 cursor-pointer" >
                                <img  className=" object-cover w-full h-full rounded-md" src={auth.currentUser.photoURL? auth.currentUser.photoURL :"https://t3.ftcdn.net/jpg/05/16/27/58/360_F_516275801_f3Fsp17x6HQK0xQgDQEELoTuERO4SsWV.jpg"}  alt="" />
                            </label>
                    }
                    <input
                         onChange={Handle_Profile_Image_Change}
                         id="Profile_Image" type="file" accept="image/*" className="hidden" />
                    <div className="px-4 py-3 text-sm text-white">
                       <div>{auth.currentUser.displayName}</div>
                        <div className="font-medium truncate">{auth.currentUser.email}</div>
                    </div>
                </div>
                <div onClick={Sign_Out} className=" flex items-center justify-center relative object-cover object-center w-11 h-11 rounded-lg  p-0.5 cursor-pointer"> <i className="fa fa-sign-out text-2xl text-red-500 hover:scale-105 hover:text-red-700"></i> </div>
            </div>
          </div>
        </div>
        <div className=' h-[98%] w-[95%] md:w-[55%] bg-slate-700 rounded-md relative'>
          {Opened_Team && 
            <Team_Chat Opened_Team={Opened_Team} set_Opened_Team={set_Opened_Team} />
          }
        </div>
        <div className= { "hidden" + " absolute top-0 right-0 z-10 md:relative w-full h-[98%]  md:w-[20%] bg-slate-900 overflow-auto shadow-xl rounded-lg md:flex flex-col items-center"}>
          {Opened_Team && 
            <Team_Files Opened_Team={Opened_Team}/>
          }
        </div>
        {
          Create_Team_Popup_Modal &&
            <Create_Team set_Create_Team_Popup_Modal={set_Create_Team_Popup_Modal} />      
        } 
    </div>
  )
}

export default Teams