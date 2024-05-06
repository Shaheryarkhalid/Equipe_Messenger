import PropTypes from 'prop-types';  

function Image_Viewer({Open_Image,set_Open_Image}) {
  return (
    <div className='absolute w-full h-full bg-slate-600  bg-opacity-60 z-50 rounded-lg' >
        <div id="crud-modal" tabIndex="1" aria-hidden="true" className=" absolute top-2 right-2 z-50">
            <button
                onClick={()=>set_Open_Image(false)}
                type="button" className="text-gray-400 0 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center bg-gray-600 hover:text-white" data-modal-toggle="crud-modal">
                <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/>
                </svg>
                <span className="sr-only">Close modal</span>
            </button>
        </div>
        <img className=" w-full h-full object-cover rounded-lg" src={Open_Image} />
    </div>
  )
}
Image_Viewer.propTypes={
  Open_Image: PropTypes.string,
  set_Open_Image:PropTypes.func
} 

export default Image_Viewer