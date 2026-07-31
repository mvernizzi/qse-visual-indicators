export default function EventDialog({
  isOpen,
  title,
  options,
  onSelect,
  onClose
}) {

  if (!isOpen) return null;

  return (
    <div style={overlayStyle}>

      <div style={dialogStyle}>

        <h2>{title}</h2>

        <div style={{marginTop:20}}>

          {options.map((option)=>(
            <button
              key={option.value}
              onClick={()=>onSelect(option)}
              style={{
                ...buttonStyle,
                background: option.color,
                color:"white"
              }}
            >
              {option.label}
            </button>
          ))}

        </div>

        <button
          onClick={onClose}
          style={cancelStyle}
        >
          Annuler
        </button>

      </div>

    </div>
  );

}

const overlayStyle={
  position:"fixed",
  top:0,
  left:0,
  right:0,
  bottom:0,
  background:"rgba(0,0,0,.35)",
  display:"flex",
  justifyContent:"center",
  alignItems:"center",
  zIndex:1000
}

const dialogStyle={
  background:"white",
  width:"420px",
  borderRadius:"12px",
  padding:"25px",
  boxShadow:"0 8px 20px rgba(0,0,0,.25)"
}

const buttonStyle={
  width:"100%",
  padding:"14px",
  marginBottom:"12px",
  border:"none",
  borderRadius:"8px",
  cursor:"pointer",
  fontSize:"15px",
  fontWeight:"bold"
}

const cancelStyle={
  width:"100%",
  padding:"12px",
  border:"1px solid #DDD",
  background:"white",
  borderRadius:"8px",
  cursor:"pointer",
  marginTop:"10px"
}