const express=require("express");
const app=express();
const { Server } = require("socket.io");
const http=require('http')
const cors = require("cors"); // 👈 import cors
const { Socket } = require("dgram");
require("dotenv").config();

const server=http.createServer(app)
const userInRoom={}

const port=process.env.PORT

// {
//   '123456': [
//     { socketId: 'PykxMVxpddqgUABGAAAJ', name: 'Nizam' },
//     { socketId: 'w3Qal_bjtzK3kGX1AAAN', name: 'Aysah' },
//     { socketId: 'B6pcsVWEmtSdT588AAAL', name: 'Bushra' }
//   ]
// }



let users=[] //  [{ id: socket.id, name: "Nizam" }]

app.use(cors());



const io=new Server(server, {
  cors: {
    origin: "*", // 👈 React frontend ka URL (Vite)
    methods: ["GET", "POST"]
  }
})





io.on("connection",(socket)=>{


  socket.on("join_room",({roomId,users})=>{
    
    socket.join(roomId);// ye hmesha ek group me logo ko add krne k liye hotya taaki kal ko uss group ko ek sath message bheja jaa sakke

    if(!userInRoom[roomId])  userInRoom[roomId]=[]
    userInRoom[roomId].push({socketId:socket.id,name:users});
    console.log(userInRoom);
    io.to(roomId).emit("join_room",userInRoom[roomId])




    
  })


  socket.on("sendMessages",({roomId,messages})=>{
  // const senderUSer= userInRoom[roomId].find((u)=>u.socketId===socket.id) // ye 
  //  console.log(senderUSer.name);
  //   socket.to(roomId).emit("ReceivedMessages",{messages})


  if (userInRoom[roomId]) {
    const senderUser = userInRoom[roomId].find((u) => u.socketId === socket.id);
    const senderName = senderUser?.name || "Unknown";

    io.to(roomId).emit("ReceivedMessages", {
      from: senderName,
      messages
    });

  }


  })

  socket.on("sendtyping",({roomId})=>{
    socket.to(roomId).emit("receieveTyping","Start Typing")
  })

  socket.on("leave_room",({roomId})=>{
    socket.leave(roomId)
// filter krke new updated user list daal isme aur yahi frontend pr bhj di
    userInRoom[roomId]= userInRoom[roomId].filter(
      (user)=>socket.id!=user.socketId// 
  )
  io.to(roomId).emit("room_users", userInRoom[roomId])
  })



  // Private chat 



  socket.on("register_user",({myName})=>{
    users.push({id:socket.id,myName});
    io.emit("all_users",{users});
  })

  socket.on("private_message",({to,message})=>{

   const fromUser= users.find((u)=>u.id==socket.id);//yaha se jo sender uska info milega 
   if(fromUser){
    io.to(to).emit("private_message",{
      from:fromUser.myName,
      message
    })
   }

  })

  socket.on("typingStart",({receiverId})=>{
    io.to(receiverId).emit("miliTyping",'Typing');
  })







  socket.on("disconnect",()=>{
    // jab user disconnect hota h toh uski id milti hai 
  //  jab manually leave button se leave krenge toh hogga pr kabhi kabhi net issue page reload se bhi leav hogga toh uss case me user ko hta denege 
    for (let roomId in userInRoom) {// ye bss ek check krna h necessary nhi h 
    userInRoom[roomId] = userInRoom[roomId].filter(
      (user) => user.socketId !== socket.id
    );

    // Send updated list to that room
    io.to(roomId).emit("room_users", userInRoom[roomId]);
  }


  users=users.filter((u)=>u.id!==socket.id) //mean jo scocket id dosconnect ho usko hta do aur baaki sabko  rakho..
  io.emit("all_users",{users}) // best approach 

  






  })







})






server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});





