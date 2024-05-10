import { useContext, useState } from "react";
import firebase from "firebase/compat/app"
import { Database_Context } from "../../../App";

function Search_Person(Search_Results) {
	let Users=Search_Results.value;
	let {auth,firestore}=useContext(Database_Context);
	let [Requests,setRequests]=useState([]);
	let [Friends,setFriends]=useState([]);
	let [SendingRequest,setSendingRequest]=useState(false);

	firestore.collection("Users").where("UID","==",auth.currentUser.uid).get().then((Snap)=>{
		( Requests.length !== Snap.docs[0].data().Sent_Invites.length) && setRequests(Snap.docs[0].data().Sent_Invites);
	});
	firestore.collection("Users").where("UID","==",auth.currentUser.uid).get().then((Snap)=>{
		( Friends.length !== Snap.docs[0].data().Friends.length) && setFriends(Snap.docs[0].data().Friends);
	});

	function Send_Invite(UID)
		{ 
		setSendingRequest(UID);
		firestore.collection("Users").where("UID","==",UID).limit(1).get().then(query => {
			const document = query.docs[0];
			document.ref.update({
				Recieved_Invites: firebase.firestore.FieldValue.arrayUnion(auth.currentUser.uid)
			})
			firestore.collection("Users").where("UID","==",auth.currentUser.uid).limit(1).get().then(query => {
				const document = query.docs[0];
				document.ref.update({
					Sent_Invites: firebase.firestore.FieldValue.arrayUnion(UID)
				}).then(()=>{
					setSendingRequest(false);
				})
			});
		});
	}
	return (
		<div className=" mt-5 w-full overflow-auto">
			{Users.docs.map((doc) => {
				return(
					<div key={doc.id} className="overflow-auto w-full flex items-center gap-4 py-3 px-1 pr-5 select-none rounded-md hover:bg-slate-600 transition-all">
						<img src={doc.data().photoUrl} alt="avatar"
						className="relative inline-block object-cover object-center w-12 h-12 rounded-lg" />
						<div>
							<h6 className="block font-sans text-white text-base antialiased font-semibold leading-relaxed tracking-normal text-inherit">
								{doc.data().Name}
							</h6>
							<p className=" max-w-[130px] truncate block font-sans text-sm antialiased font-normal leading-normal text-gray-400">
								{doc.data().Email}
							</p>
						</div>
						<button
							onClick={()=>{Send_Invite(doc.data().UID)}}
							className=" absolute right-5 p-0.5 mb-2 me-2 overflow-hidden text-sm font-medium  rounded-lg group">
							<span className="relative flex items-center  justify-center transition-all ease-in duration-75">
								{ Requests && (Requests.includes(doc.data().UID) || (Friends.includes(doc.data().UID)) || (auth.currentUser.uid === doc.data().UID) ) && <i key={doc.id} className="fa fa-user-check text-lg text-slate-300 cursor-not-allowed"></i>  }
								{ ((!SendingRequest || !SendingRequest == doc.data().UID) && !Requests.includes(doc.data().UID) && ((!Friends.includes(doc.data().UID)) && (auth.currentUser.uid !== doc.data().UID))) && <i key={doc.id} className="fa fa-user-plus text-lg text-slate-300 "></i> }
								{
									SendingRequest == doc.data().UID && 
										<div key={doc.id} className="h-full w-full flex items-center justify-center cursor-not-allowed">
										<div role="status">
										<svg aria-hidden="true" className="w-4 h-4 animate-spin text-gray-600 fill-blue-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
											<path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/><path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/></svg>
										<span className="sr-only">Loading...</span>
										</div>
									</div>
								}
							</span>
						</button> 
					</div>
				)
			})}
		</div>
	)
}
export default Search_Person