import React, { Component } from 'react';
//import relevant components from react native
import NetInfo from '@react-native-community/netinfo';
import { StyleSheet, Text, View, Platform, AsyncStorage } from 'react-native';
import { GiftedChat, InputToolbar } from 'react-native-gifted-chat';
import KeyboardSpacer from 'react-native-keyboard-spacer';
//import custom CustomActions
import CustomActions from './CustomActions';
//import MapView
import MapView from 'react-native-maps';
// create Screen2 (Chat) class
//import firebase
const firebase = require('firebase');
require('firebase/firestore');

// create Screen2 (Chat) class
export default class Chat extends Component {

  constructor() {
    super();

    if (!firebase.apps.length) {
      firebase.initializeApp({
        apiKey: "AIzaSyA5LJNBLFMVgZTWvfH73fqRaiFLwCOjWmM",
        authDomain: "test-d614c.firebaseapp.com",
        databaseURL: "https://test-d614c.firebaseio.com",
        projectId: "test-d614c",
        storageBucket: "test-d614c.appspot.com",
        messagingSenderId: "799483602316",
        appId: "1:799483602316:web:0eaaf90d0b214244b822a9",
      });
    }

    
    this.referenceChatMessages = firebase.firestore().collection('messages');

    this.state = {
      messages: [],
      uid: 0,
      isConnected: false,
      image: null
    };
  }

  // get messages from asyncStorage
  async getMessages() {
    let messages = '';
    try {
      messages = await AsyncStorage.getItem('messages') || [];
      this.setState({
        messages: JSON.parse(messages)
      });
    } catch (error) {
      console.log(error.message);
    }
  };

  // save messages in asyncStorage
  async saveMessages() {
    try {
      await AsyncStorage.setItem('messages', JSON.stringify(this.state.messages));
    } catch (error) {
      console.log(error.message);
    }
  };

  // delete messages from asyncStorage
  async deleteMessages() {
    try {
      await AsyncStorage.removeItem('messages');
    } catch (error) {
      console.log(error.message);
    }
  }

  // componentDidMount is a "lifecycle method". Lifecycle methods run the
  // function at various times during a component's "lifecycle". For example
  // componentDidMount will run right after the component was added to the page.
  componentDidMount() {
    // const doGreeting = (name) => {
    //   alert('Hi ' + name);
    // }
    // doGreeting('Cilvin')
    // NetInfo.addEventListener(state => {
    //   doGreeting('Luke')
    // });

    // NetInfo is a library that gives you access to the current network status
    // of the user's device. For example, are we connected or disconnected from
    // the network.

    // .addEventListener registers a function to be called whenever an "event"
    // happens, which in this case would be when the connectivity status
    // changes. The function you give to addEventListener will be called with
    // the "state" object, which has properties on it like "isConnected".
     NetInfo.addEventListener(state => {
      this.handleConnectivityChange(state)
     })

    NetInfo.fetch().then(state => {
      const isConnected = state.isConnected;
      if (isConnected) {
        this.setState({
          isConnected: true,
        });

        this.authUnsubscribe = firebase.auth().onAuthStateChanged(async user => {
          if (!user) {
            await firebase.auth().signInAnonymously();
          }

          this.setState({
            uid: user.uid,
            messages: []
          });

          this.unsubscribe = this.referenceChatMessages.orderBy('createdAt', 'desc').onSnapshot(this.onCollectionUpdate);
        });
      } else {
        this.setState({
          isConnected: false,
        });

        this.getMessages();
      }
    });
  }

  componentWillUnmount() {
    this.unsubscribe();
    this.authUnsubscribe();

    NetInfo.isConnected.removeEventListener(
        'connectionChange',
        this.handleConnectivityChange
    );
  };

  onCollectionUpdate = (querySnapshot) => {
    const messages = [];
    // go through each document
    querySnapshot.forEach((doc) => {
      // get the QueryDocumentSnapshot's data
      var data = doc.data();
      messages.push({
        _id: data._id,
        text: data.text || '',
        createdAt: data.createdAt.toDate(),
        user: data.user,
        image: data.image || null,
        location: data.location || null,
       
      });
    });

    this.setState({
      messages,
    });
  };

  handleConnectivityChange = (state) => {
    const isConnected = state.isConnected;
    if(isConnected == true) {
      this.setState({
        isConnected: true
      });
      this.unsubscribe = this.referenceChatMessages.orderBy('createdAt', 'desc').onSnapshot(this.onCollectionUpdate);
    } else {
      this.setState({
        isConnected: false
      });
    }
  };


  addMessage() {
    const message = this.state.messages[0];
    this.referenceChatMessages.add({
      _id: message._id,
      text: message.text || '',
      createdAt: message.createdAt,
      user: message.user,
      image: message.image || null,
      location: message.location || null,
    });
  }
  //define title in navigation bar
  static navigationOptions = ({ navigation }) => {
    return {
      title: navigation.state.params.userName,
    };
  };

  //appending new message to messages object
  onSend(messages = []) {
    this.setState(previousState => ({
      messages: GiftedChat.append(previousState.messages, messages),
    }), () => {
      this.addMessage();
      this.saveMessages();
    });
  };

  // hide inputbar when offline
  renderInputToolbar(props) {
    console.log('renderInputToolbar --> props', props.isConnected);
    if (props.isConnected === false) {
    } else {
      return(
        <InputToolbar
        {...props}
        />
      );
    }
  };

   //display the communication features
   renderCustomActions = (props) => {
    return <CustomActions {...props} />;
  };

  //custom map view
  renderCustomView (props) {
   const { currentMessage} = props;
   if (currentMessage.location) {
     return (
         <MapView
           style={{width: 150,
             height: 100,
             borderRadius: 13,
             margin: 3}}
           region={{
             latitude: currentMessage.location.latitude,
             longitude: currentMessage.location.longitude,
             latitudeDelta: 0.0922,
             longitudeDelta: 0.0421,
           }}
         />
     );
   }
   return null;
 }



  //render components
  render() {
    return (
      //fullscreen component
      <View style={{ flex:1, backgroundColor: this.props.navigation.state.params.backgroundColor }}>
        <GiftedChat
          messages={this.state.messages}
          isConnected={this.state.isConnected}
          renderInputToolbar={this.renderInputToolbar}
          renderActions={this.renderCustomActions}
          renderCustomView={this.renderCustomView}
          onSend={messages => this.onSend(messages)}
          user={{
            _id: this.state.uid
          }}
        />
        {Platform.OS === 'android' ? <KeyboardSpacer /> : null }
      </View>
    );
  }
};

const styles = StyleSheet.create({

});