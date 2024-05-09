import { useState, useContext ,useRef, useEffect } from "react"
import { useNavigate } from "react-router-dom";
import { useCollectionData } from "react-firebase-hooks/firestore";
import { signOut } from "firebase/auth";
import { Database_Context } from "../../App.jsx";
import { View_Context } from "../../App.jsx";
import Contact from "./Contacts/Contact.jsx";
import Search_Person from "./Search Person/Search_Person.jsx";
import Connection_Request from "./Connection_Request/Connection_Request.jsx";
import Message from "./Messages/Message.jsx";
import Responsive_Loader from "../Loading/Responsive_Loader.jsx";
import { uploadBytes,ref, getDownloadURL } from "firebase/storage";

function Connect() {
	let [Search_Results,setSearch_Results]=useState(null);
	let [Search_Error,set_Search_Error]=useState("");
	let [Contacts,setContacts]=useState(null);
	let [Loading_Contacts,set_Loading_Contacts]=useState(false);
	let [Loading_Messages]=useState(false);
	let [Chats,set_Chats]=useState([]);
	let [Loading_Chats,set_Loading_Chats]=useState(false);
	let [Opened_Contact,set_Opened_Contact]=useState("");
	let [Display_Chat,set_Display_Chat]=useState(true);
    let [Uploading_Profile,set_Uploading_Profile]=useState(false);
	let {auth,firestore,StorageBuck}=useContext(Database_Context);
	let {Left_Drawer, set_Left_Drawer}=useContext(View_Context);
	let navigate=useNavigate();
	const search_Person = useRef("")
	const [chats] = useCollectionData(firestore.collection("Last_Chat").where("User_ID","==",auth.currentUser.uid));

	useEffect(()=>{
		Opened_Contact ? set_Left_Drawer(false): set_Left_Drawer(true);
	},[Opened_Contact])
	
	useEffect(()=>{
		set_Loading_Contacts(true);
		firestore.collection("Users").where("UID","==",auth.currentUser.uid).onSnapshot((Snap)=>{
			let temp=[];
			if(!Snap.exist)
			{
				set_Loading_Contacts(false);
				setContacts([]);
			}
			Snap.docs[0].data().Friends.map((friend)=>{
				firestore.collection("Users").where("UID","==",friend).get().then((QuerySnap)=>{
					setContacts([...temp , QuerySnap.docs[0].data()]); 
					temp.push(QuerySnap.docs[0].data())
					Contacts && Contacts.length > 0 && set_Loading_Contacts(false);
				})
			})
		});
	},[]);

	useEffect(()=>{
		set_Loading_Chats(true);
		if(chats && chats.length === 0)
		{
			set_Loading_Chats(false);
			set_Chats([])
		} 		
		if(chats && chats.length > 0)
		{
			let cht=chats[0].Chats;
			cht=cht.sort((a,b)=>{return b.Created_At.seconds - a.Created_At.seconds});
			Promise.all(
			cht.map((val)=>{
				return firestore
						.collection("Users")
						.where("UID","==",val.Chat_User)
						.get()
						.then((QuerySnap)=>{
							return QuerySnap.docs[0].data();
						})
			})
			).then((User_Data)=>{
				set_Chats([...User_Data.filter((usr)=>usr.Friends.includes(auth.currentUser.uid))]);
				set_Loading_Chats(false);
			})
		}
	},[chats,Contacts]);

	function Handle_Search()
	{
		let upperCase_search_Person= search_Person.current.value.charAt(0).toUpperCase() + search_Person.current.value.slice(1);
		if(!search_Person.current.value.replace(/\s/g, '').length) {
			setSearch_Results("");
			set_Search_Error("");
			return
		}
		firestore.collection("Users").orderBy("Name").startAt(search_Person.current.value).endAt(search_Person.current.value + "\uf8ff").limit(5)
		.get()
		.then((QuerySnap)=>{
			if(QuerySnap.docs.length >0 )
			{
				setSearch_Results(QuerySnap);
				set_Search_Error("");
			}
			else{
			firestore.collection("Users").orderBy("Name").startAt(upperCase_search_Person).endAt(upperCase_search_Person + "\uf8ff").limit(5)
			.get()
				.then((QuerySnap)=>{
				if(QuerySnap.docs.length == 0)
				{
					setSearch_Results(QuerySnap);
					set_Search_Error("No Results...");
				}else{
					setSearch_Results(QuerySnap);
					set_Search_Error("");
				}
				});
			}
		});
	} 
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
    <div className="h-[calc(100vh-96px)]  w-full flex justify-evenly items-center bg-slate-800 relative">
    	<div className={(Left_Drawer?"flex ": "hidden")+" absolute top-0 left-0 z-20 md:relative w-full h-[98%]  md:w-[20%] pt-8 bg-slate-900 overflow-auto shadow-xl rounded-lg md:flex flex-col items-center"}>
			<div  className="w-full px-4 flex flex-col justify-center relative">
				<div  >
					<input
						ref={search_Person}
						onKeyUp={Handle_Search}
						type="text" className=" w-full h-8 px-4 rounded-md bg-slate-300 focus:bg-slate-100 focus:outline-green-500 relative" placeholder="Search People" />
						<span onClick={()=>{
							search_Person.current.value=""; 
							Handle_Search()
							}} className="absolute  right-6 top-0.5 cursor-pointer"><i className="fa fa-times text-red-800 text-xl"></i></span>
				</div>
			
				{Search_Error &&
					<span className=" w-full text-center mt-5 text-red-500" >{Search_Error}</span>
				}
				{ Search_Results &&
						<Search_Person key={Search_Results.size} value={Search_Results} />
				}
			</div>
			<div className="w-full px-4 pt-4 p-2 mt-8  flex flex-col justify-center relative">
				<Connection_Request />
			</div>
			<div className=" md:hidden p-2 w-full bg-slate-600 flex justify-evenly">
				<button className="relative inline-flex items-center justify-center p-0.5 mb-2 me-2 overflow-hidden text-sm font-medium rounded-lg group bg-gradient-to-br from-purple-600 to-blue-500 group-hover:from-purple-600 group-hover:to-blue-500 hover:text-white text-white focus:ring-4 focus:outline-none focus:ring-blue-800" >
					<span onClick={()=>set_Display_Chat(false)} className={(!Display_Chat ? "" : " bg-gray-900 ") + "relative px-5 py-2.5 transition-all ease-in duration-75  bg-opacity-0 rounded-md"}>
						All Connections
					</span>
				</button>
				<button className="relative inline-flex items-center justify-center p-0.5 mb-2 me-2 overflow-hidden text-sm font-medium  rounded-lg group bg-gradient-to-br from-purple-600 to-blue-500 group-hover:from-purple-600 group-hover:to-blue-500 hover:text-white text-white focus:ring-4 focus:outline-none focus:ring-blue-800">
				<span onClick={()=>set_Display_Chat(true)}  className={(Display_Chat ? "" : " bg-gray-900 ") + "relative px-5 py-2.5 transition-all ease-in duration-75  bg-opacity-0 rounded-md"}>
					Chats
				</span>
				</button>
			</div>
            <div className="hidden w-full h-full mt-5  bg-slate-800 relative overflow-auto md:flex flex-col items-center">
            	<h1 className="w-full text-center sticky top-[0] p-3 text-md font-bold text-white bg-slate-700 z-10 ">All Connections</h1>
				<div className=" w-full h-full overflow-auto flex flex-col px-2">
					{
						Loading_Contacts && 
							<div className=" absolute top-1/4">
								<Responsive_Loader  />
							</div>
					} 
					{
						Contacts && Contacts.length > 0 &&
							Contacts.map((usr)=>{
								return(
									<>
										<button onClick={()=>set_Opened_Contact(usr.UID)} >
											<Contact key={usr.id}  usr={usr} Opened_Contact={Opened_Contact} />
										</button>
									</>
								)
							})
					}
					{
						!Loading_Contacts && Contacts && Contacts.length === 0 &&
							<span className=" w-full text-center mt-5 text-red-500" >No Connections</span>        
					}
				</div>
            </div>
            <div className="flex w-full h-full mt-5  bg-slate-800 relative overflow-auto md:hidden flex-col items-center">
              {
                Display_Chat ?
                  <>
                    <h1 className="w-full text-center sticky top-[0] p-3 text-md font-bold text-white bg-slate-700 ">Chats</h1>
                    <div className=" w-full h-full overflow-auto flex flex-col px-2">
                        {
                          Loading_Chats &&
                          <div className=" absolute top-1/4">
                            <Responsive_Loader  />
                          </div>
                        } 
                        {
                          (Chats && Chats.length > 0) &&
                            Chats.map((usr)=>{
                              return(
                                <>
									<button onClick={()=>set_Opened_Contact(usr.UID)} >
										<Contact key={usr.id}  usr={usr} Opened_Contact={Opened_Contact} />
									</button>
                                </>
                              )
                            })
                        }
                        { !Loading_Chats && Chats && Chats.length === 0 && <span className=" w-full text-center mt-5 text-red-500" >No contacts to show </span> }
                    </div>
                  </>
                  :
                  <>
                      <h1 className="w-full text-center sticky top-[0] p-3 text-md font-bold text-white bg-slate-700 z-10 ">All Connections</h1>
                      <div className=" w-full h-full overflow-auto flex flex-col px-2">
                          {
                            Loading_Contacts &&
								<div className=" absolute top-1/4 z-10">
									<Responsive_Loader  />
								</div>
                          } 
                          {
                            (Contacts && Contacts.length > 0) &&
								Contacts.map((usr)=>{
								return(
									<>
									<button onClick={()=>set_Opened_Contact(usr.UID)} >
										<Contact key={usr.id}  usr={usr} Opened_Contact={Opened_Contact} />
									</button>
									</>
								)
								})
                          }
                          {
                            !Loading_Contacts && Contacts && Contacts.length === 0 &&
                              <span className=" w-full text-center mt-5 text-red-500" >No contacts to show </span>        
                          }
                      </div>
                  </>      
              }
              <div className={ " w-3/4  bg-slate-900 rounded-md flex items-center justify-center md:flex"}>
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
        <div className="w-[95%] h-[98%]  md:w-[55%] bg-slate-700 shadow-xl  rounded-xl relative">
            {
              Loading_Messages &&
                  <Responsive_Loader key={Loading_Messages.id} />
            }
            {  Opened_Contact &&
                <Message key={"ID"} Opened_Contact={Opened_Contact} set_Opened_Contact={set_Opened_Contact} />
            } 
        </div>
        <div className= { "hidden" + " top-0 right-0 z-10 relative w-full h-full  md:w-[20%] bg-slate-900 overflow-auto shadow-xl rounded-lg md:flex flex-col items-center"}>        
          <div className="w-full h-full   bg-slate-800 rounded-md  relative overflow-auto flex flex-col items-center">
              <h1 className="w-full text-center sticky top-[0] p-3 text-md font-bold text-white bg-slate-700 ">Chats</h1>
              <div className=" w-full h-full overflow-auto flex flex-col px-2">
                  {
                    Loading_Chats &&
                    <div className=" absolute top-1/4">
                      <Responsive_Loader  />
                    </div>
                  } 
                  {
                    (Chats && Chats.length > 0) &&
                      Chats.map((usr)=>{
							return(
								<>
								<button onClick={()=>set_Opened_Contact(usr.UID)} >
									<Contact key={usr.id}  usr={usr} Opened_Contact={Opened_Contact} />
								</button>
								</>
							)
                      })
                  }
                  {
                    !Loading_Chats && Chats && Chats.length === 0 &&
                      <span className=" w-full text-center mt-5 text-red-500" >No chats to show </span>        
                  }
              </div>
              
          </div>
        </div>
  </div>
  )
}
export default Connect