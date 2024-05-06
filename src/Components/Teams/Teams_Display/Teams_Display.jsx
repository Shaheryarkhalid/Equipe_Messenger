import { useContext} from "react"
import { Database_Context } from "../../../App"
import {useCollectionData} from "react-firebase-hooks/firestore"
import PropTypes from 'prop-types';  


function Teams_Display({team, set_Opened_Team, Opened_Team }) {
    let {auth,firestore}= useContext(Database_Context);
    let [result] =useCollectionData(firestore.collection("Team_Chat").where("Team_ID","==",team.TID));
    let Unread_Messages;
    if(result && result.length>0 ) Unread_Messages=result.filter(a=>{if(a.Read_By && !a.Read_By.includes(auth.currentUser.uid)) return a});
    return (
        <div className=' w-full p-2'>
            { team &&
                <>
                    <div onClick={()=>set_Opened_Team(team)}  className={(team && Opened_Team && team.TID === Opened_Team.TID ? " bg-slate-600 "  : "" ) + " relative w-full mt-2 flex items-center gap-4 py-2 px-4 border-b border-slate-300 cursor-pointer hover:bg-slate-700 rounded-t-lg"}>
                    <img src={team.Photo_URL} alt="avatar"
                        className="relative inline-block object-cover object-center w-12 h-12 rounded-lg" />
                    <div className=" relative">
                        <h6 className="block font-sans text-left text-gray-200 antialiased font-semibold leading-relaxed tracking-normal ">
                        {team.Name}
                        {team.Created_By === auth.currentUser.uid && <span className=" ml-2 text-slate-400">(Owner)</span>}
                        </h6>
                        <p className="block font-sans text-left text-sm antialiased font-normal leading-normal text-gray-400">
                        {team.Objective}
                        </p>
                    </div>
                    { team && Opened_Team && Opened_Team.TID !== team.TID &&  Unread_Messages && Unread_Messages.length > 0  &&
                        <span className="absolute left-0 top-1  inline-flex items-center justify-center w-4 h-4 ms-2 text-xs font-semibold text-slate-300 bg-red-500 rounded-full">
                        {  Unread_Messages.length > 99 ? "99+" : Unread_Messages.length }
                        </span>
                    }
                    </div>
                </>
            }
        </div>
    )
}
Teams_Display.propTypes={
    team : PropTypes.object, 
    set_Opened_Team:PropTypes.func,
    Opened_Team:PropTypes.object 
}
export default Teams_Display