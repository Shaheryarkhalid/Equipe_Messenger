import { Database_Context } from "../../../App"
import { useContext } from "react"
import { useCollectionData } from "react-firebase-hooks/firestore";
import PropTypes from 'prop-types';  

function Contact({usr,Opened_Contact}) {

	let {firestore,auth}=useContext(Database_Context);
	let Unread_Messages=useCollectionData(firestore.collection("Messages").where("Sender_Id","==",usr.UID).where("Reciever_Id","==",auth.currentUser.uid).where("Read","==",false));
	return (
		<div  className={(usr.UID === Opened_Contact ? " bg-slate-600 "  : "" )+ "relative mt-2 flex items-center gap-4 py-2 px-4 border-b border-slate-300 cursor-pointer hover:bg-slate-700 rounded-t-lg"}>
					<img src={usr.photoUrl} alt="avatar"
						className="relative inline-block object-cover object-center w-12 h-12 rounded-lg" />
						
					<div className=" relative">
						<h6 className="block font-sans text-left text-gray-200 antialiased font-semibold leading-relaxed tracking-normal ">
							{usr.Name}
						</h6>
						<p className="block font-sans max-w-[130px] truncate text-left text-sm antialiased font-normal leading-normal text-gray-400">
							{usr.Email}
						</p>
					</div>
					{ usr && Opened_Contact !== usr.UID &&  Unread_Messages && Unread_Messages.length > 0 && Unread_Messages && Unread_Messages[0] && Unread_Messages[0].length > 0 &&
						<span className="absolute left-0 top-1  inline-flex items-center justify-center w-4 h-4 ms-2 text-xs font-semibold text-slate-300 bg-red-500 rounded-full">
							{ Unread_Messages[0].length > 99 ? "99+" : Unread_Messages[0].length }
						</span>
					}
		</div>
	)
}
Contact.propTypes={
	usr:PropTypes.shape({
		UID:PropTypes.string,
		photoUrl:PropTypes.string,
		Name:PropTypes.string,
		Email:PropTypes.string
	}),
	Opened_Contact:PropTypes.string
}
export default Contact