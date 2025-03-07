import bcrypt from'bcrypt';

export const hashPasword = async (password)=>{
    try {
        const saltRound = 12;
        const hashedPassword = await bcrypt.hash(password,saltRound);
        return hashedPassword
    } catch (error) {
        
    }
}

// comparing password fucntion for the login 

export const comparePassword = async(password, hashedPassword)=>{
    return bcrypt.compare(  password,hashedPassword)
}