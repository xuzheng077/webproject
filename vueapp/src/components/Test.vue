<template>
  <div class="test">
    <!--bind data using {{}} or v-text-->
    <h1>{{title}}</h1>
    <h2>{{content}}</h2>
    <!-- v-if v-else-->
    <h3 v-if="showInfo">{{myInfo.firstName}}</h3>
    <h3 v-if="showInfo" v-text="myInfo.lastName"></h3>
    <h3 v-else>{{myInfo.nickName}}</h3>
    <!-- v-for -->
    <ul>
      <li v-for="person in people">{{person.name}}</li>
    </ul>
    <!-- v-on click-->
    <button v-on:click="invoke(myInfo.nickName)">Are you there?</button>
    <!-- v-on click-->
    <input type="text" v-on:keyup="pressKey()" v-on:keyup.enter="enterHit()"/>

    <hr>
    <!-- computed attribute 计算属性-->
    <label> First Name: </label>
    <input type="text" v-model="myInfo.firstName"/>
    <br>
    <label> Last Name: </label>
    <input type="text" v-model="myInfo.lastName"/>
    <br>
    <h3>{{fullName}}</h3>

    <!-- props 属性 -->
    <h2>{{msg}}</h2>
  </div>
</template>

<script>
export default {
  name: "test",
  props:{
    msg:{
      type:String,
      default: "Default message"
    }
  },
  data() {
    return {
      title:"Hello Mr.Stark.",
      content:"My name is Javis.",
      myInfo:{
        firstName: "Tony",
        lastName: "Stark",
        nickName: "Iron Man"
      },
      showInfo:true,
      people:[{name:"Black Widow"},{name:"Vision"},{name:"War Machine"}]
    }
  },
  methods:{
    invoke:function(name){
      alert("Yes, what can I do for you, "+name+"?");
    },
    pressKey:function(){
      console.log("I'm here");
    },
    enterHit:function(){
      console.log("enter enter");
    }
  },
  computed:{
    fullName:function(){
      return this.myInfo.firstName + " " + this.myInfo.lastName;
    }
  }
};
</script>

<style scoped>
</style>
