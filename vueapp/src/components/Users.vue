<template>
  <div class="users">
    <h1>Users</h1>
    <!--add user-->
    <form v-on:submit="addUser">
      <input type="text" v-model="newUser.name" placeholder="Enter name"><br>
      <input type="text" v-model="newUser.email" placeholder="Enter email"><br>
      <input type="submit" value="Submit">
    </form>

    <!--display user-->
    <ul>
      <li v-for="user in users">
        <input type="checkbox" class="toggle" v-model="user.contacted">
        <span :class="{contacted: user.contacted}">
          {{user.name}} : {{user.email}}
          <button v-on:click="deleteUser(user)">Delete</button>
        </span>
      </li>

    </ul>
  </div>
</template>

<script>
export default {
  name: "users",
  data() {
    return {
      newUser:{},
      users:[{
        name:"test",
        email:"safagg",
        contacted:false
      }]
    }
  },
  methods:{
    addUser:function(e){
      this.users.push({name: this.newUser.name, email: this.newUser.email, contacted:false});
      e.preventDefault();
    },
    deleteUser:function(user){
      this.users.splice(this.users.indexOf(user),1);
    }
  },
  created:function(){
    this.$http.get("https://jsonplaceholder.typicode.com/users").then((response)=>{
      this.users = response.data;
      for(let i=0;i<this.users.length;i++){
        this.users[i].contacted = false;
      }
      console.log(this.users)
    });
  }
};
</script>

<style scoped>
  .contacted{
    text-decoration: line-through;
  }
</style>
