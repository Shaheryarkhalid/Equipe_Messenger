import { useState, useContext} from "react";
import { useNavigate } from "react-router-dom"
import { Database_Context } from "../../App.jsx";
import { View_Context } from "../../App.jsx";
import { signOut } from "firebase/auth";
import {  ref, uploadBytes, getDownloadURL} from "firebase/storage";
import Responsive_Loader from "../Loading/Responsive_Loader.jsx";
import { v4 } from "uuid";

function Nav_Bar() {
    let navigate= new useNavigate();
    let [Team,set_Team]=useState(false);
    let {auth,firestore,StorageBuck}=useContext(Database_Context);
    let {Left_Drawer, set_Left_Drawer  }=useContext(View_Context);
    let [Uploading_Profile,set_Uploading_Profile]=useState(false);

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
        <nav className="w-full h-24   bg-slate-800 flex justify-evenly items-center shadow-2xl relative">
            <div className={(Left_Drawer ? "hidden absolute left-0 top-2 w-full self-start justify-self-center " : "hidden " ) + "md:relative h-[85%] md:w-[20%] bg-slate-900 rounded-md md:flex"}> 
                <img className=" h-full w-full bg-slate-100 object-cover rounded-md" src="src/assets/logo.jpg"  alt="" />
            </div>
            <div className="h-[85%] w-full md:w-[55%] px-1 flex justify-evenly">
                <div onClick={()=>set_Left_Drawer(!Left_Drawer)} className="md:hidden h-full w-[10%] flex items-center justify-center">
                    { Left_Drawer ? <i className=" fa fa-times text-4xl p-3 bg-slate-900 text-slate-400 rounded-md"></i> : <i className=" fa fa-bars text-4xl p-3 bg-slate-900 text-slate-400 rounded-md"></i> }
                </div>
                <a onClick={()=>{set_Team(false); navigate("/");}}  href="#" className={(!Team ? " border-b-2 border-slate-600 " : " border-0 " ) + " bg-slate-900 h-full w-[40%] flex items-center justify-center  rounded-md"}>
                    <i className="fa fa-user text-2xl text-slate-400"> </i>
                </a>
                <a onClick={()=>{set_Team(true); navigate("/Teams");}} href="#" className={(Team ? " border-b-2 border-slate-600 " : " border-0 " ) + "bg-slate-900 h-full w-[40%] flex items-center justify-center  rounded-md " }>
                    <i className="fas fa-user-group text-2xl text-slate-400"></i>
                </a>
            </div>
            <div className={ "hidden " + "md:relative h-[85%] md:w-[20%] bg-slate-900 rounded-md flex items-center justify-center md:flex"}>
                <div className=" h-full flex flex-row items-center">
                    {
                        Uploading_Profile ? <Responsive_Loader /> :
                            <label htmlFor="Profile_Image" className="inline-block relative object-cover object-center w-12 h-12 rounded-lg border-2 border-green-500 p-0.5 cursor-pointer" >
                                <img  className="" src={auth.currentUser.photoURL? auth.currentUser.photoURL :"https://t3.ftcdn.net/jpg/05/16/27/58/360_F_516275801_f3Fsp17x6HQK0xQgDQEELoTuERO4SsWV.jpg"}  alt="" />
                            </label>
                    }
                    <input
                         onChange={Handle_Profile_Image_Change}
                         id="Profile_Image" type="file" accept="image/*" className="hidden" />
                    <div className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                       <div className=" truncate max-w-[130px]">{auth.currentUser.displayName}</div>
                        <div className="font-medium truncate max-w-[130px]">{auth.currentUser.email}</div>
                    </div>
                </div>
                <div onClick={Sign_Out} className=" flex items-center justify-center relative object-cover object-center w-11 h-11 rounded-lg  p-0.5 cursor-pointer"> <i className="fa fa-sign-out text-2xl text-red-500 hover:scale-105 hover:text-red-700"></i> </div>
            </div>
        </nav>
    )
}
export default Nav_Bar