import './../App.css';

export function codeToHex(code) {
    if(code === -1){
        return "0x??";
    } else {
        return "0x" + (code & 0xFF).toString(16).padStart(2, '0').toUpperCase();
    }
}

export function Header(props) {
    return (
        <div className="puzzle-code-header">
            {props.text ?? 'Generated:'}
        </div>
    );
}

export function ConstCode(props){
    return (
        <div className="puzzle-code">
            {props.code}
        </div>
    );
}