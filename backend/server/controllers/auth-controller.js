const home= async (req, res) => {
    try {
         res .status(200)
             .send('Home');
     

    } catch (error) {
        console.log(error);
        
    }
};


const register=async(req, res) => {
try { 
    console.log(req.body);
    res.status(200).send({message:req.body});
      
} catch (error) {
   res.status(500).json("Server Error");

}
};




module.exports={home,register};