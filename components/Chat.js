/**
 * @description this is the chatscreen, where the user can write and sent
 * messages, images or geo-location
 * @class Chat
 * @requires React
 * @requires React-Native
 * @requires Keyboard-Spacer
 * @requires React-Native-Gifted-Chat
 * @requires CustomActions
 * @requires React-Native-Maps
 * @requires Firebase
 * @requires Firestore
 */

//  import react component
import React, { Component } from "react";
//import relevant components from react native
import NetInfo from "@react-native-community/netinfo";
import { StyleSheet, Text, View, Platform, AsyncStorage } from "react-native";
import { GiftedChat, InputToolbar } from "react-native-gifted-chat";
import KeyboardSpacer from "react-native-keyboard-spacer";
//import custom CustomActions
import CustomActions from "./CustomActions";
//import MapView
import MapView from "react-native-maps";

// create Screen2 (Chat) class
//import firebase
const firebase = require("firebase");
require("firebase/firestore");

// create Screen2 (Chat) class
export default class Chat extends Component {
  constructor() {
    super();

    /**
     * initializing firebase
     * @param {object} firebaseConfig
     * @param {string} apiKey
     * @param {string} authDomain
     * @param {string} databaseURL
     * @param {string} projectID
     * @param {string} storageBucket
     * @param {string} messagingSenderId
     * @param {string} appId
     */

    if (!firebase.apps.length) {
      firebase.initializeApp({
        apiKey: "AIzaSyA5LJNBLFMVgZTWvfH73fqRaiFLwCOjWmM",
        authDomain: "test-d614c.firebaseapp.com",
        databaseURL: "https://test-d614c.firebaseio.com",
        projectId: "test-d614c",
        storageBucket: "test-d614c.appspot.com",
        messagingSenderId: "799483602316",
        appId: "1:799483602316:web:0eaaf90d0b214244b822a9"
      });
    }

    this.referenceChatMessages = firebase.firestore().collection("messages");

    this.state = {
      messages: [],
      uid: 0,
      isConnected: false,
      image: null
    };
  }

  /**
   * loads all messages from AsyncStorage
   * @function getMessages 
   * @async
   * @return {Promise<string>} The data from the storage
   */
  getMessages = async () => {
    let messages = "";
    try {
      messages = (await AsyncStorage.getItem("messages")) || [];
      this.setState({
        messages: JSON.parse(messages)
      });
    } catch (error) {
      console.log(error.message);
    }
  };

  /**
   * saves all messages from AsyncStorage
   * @function saveMessages 
   * @async
   */
  saveMessages = async () => {
    try {
      await AsyncStorage.setItem(
        "messages",
        JSON.stringify(this.state.messages)
      );
    } catch (error) {
      console.log(error.message);
    }
  };

  /**
   * deletes all messages from AsyncStorage
   * @function deleteMessages
   * @async
   */

  deleteMessages = async () => {
    try {
      await AsyncStorage.removeItem("messages");
    } catch (error) {
      console.log(error.message);
    }
  };

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
      this.handleConnectivityChange(state);
    });

    NetInfo.fetch().then(state => {
      const isConnected = state.isConnected;
      if (isConnected) {
        this.setState({
          isConnected: true
        });

        this.authUnsubscribe = firebase
          .auth()
          .onAuthStateChanged(async user => {
            if (!user) {
              await firebase.auth().signInAnonymously();
            }

            this.setState({
              uid: user.uid,
              messages: []
            });

            this.unsubscribe = this.referenceChatMessages
              .orderBy("createdAt", "desc")
              .onSnapshot(this.onCollectionUpdate);
          });
      } else {
        this.setState({
          isConnected: false
        });

        this.getMessages();
      }
    });
  }

  componentWillUnmount() {
    this.unsubscribe();
    this.authUnsubscribe();

    NetInfo.isConnected.removeEventListener(
      "connectionChange",
      this.handleConnectivityChange
    );
  }

  /**
   * onCollectionUpdte takes snapshot on collection update
   * @function onCollectionUpdate
   * @param {string} _id
   * @param {string} text
   * @param {number} created.At
   * @param {object} user
   * @param {string} user._id
   * @param {string} image
   * @param {object} location
   * @param {number} location.longitude
   * @param {number} location.latitude
   */
  onCollectionUpdate = querySnapshot => {
    const messages = [];
    // go through each document
    querySnapshot.forEach(doc => {
      // get the QueryDocumentSnapshot's data
      const data = doc.data();
      messages.push({
        _id: data._id,
        text: data.text || "",
        createdAt: data.createdAt.toDate(),
        user: data.user,
        image: data.image || null,
        location: data.location || null
      });
    });

    this.setState({
      messages
    });
  };

  /**
   * checks networkstatus of user
   * @function handleConnectivityChange
   */
  handleConnectivityChange = state => {
    const isConnected = state.isConnected;
    if (isConnected == true) {
      this.setState({
        isConnected: true
      });
      this.unsubscribe = this.referenceChatMessages
        .orderBy("createdAt", "desc")
        .onSnapshot(this.onCollectionUpdate);
    } else {
      this.setState({
        isConnected: false
      });
    }
  };

  /**
   * adds the message object to firestore, fired by onSend function
   * @function addMessage
   * @param {string} _id
   * @param {string} text
   * @param {number} created.At
   * @param {object} user
   * @param {string} user._id
   * @param {string} image
   * @param {object} location
   * @param {number} location.longitude
   * @param {number} location.latitude
   */
  addMessage = () => {
    const message = this.state.messages[0];
    this.referenceChatMessages.add({
      _id: message._id,
      text: message.text || "",
      createdAt: message.createdAt,
      user: message.user,
      image: message.image || null,
      location: message.location || null
    });
  };
  //define title in navigation bar
  static navigationOptions = ({ navigation }) => {
    return {
      title: `${navigation.state.params.userName}'s Chat`
    };
  };

  /**
   * handles actions when user hits send-button
   * @function onSend
   * @param {object} messages
   */
  onSend = (messages = []) => {
    this.setState(
      previousState => ({
        messages: GiftedChat.append(previousState.messages, messages)
      }),
      () => {
        this.addMessage();
        this.saveMessages();
      }
    );
  };

 /**
  * hides inputbar when offline
  * @function renderInputToolbar
  */
  renderInputToolbar = props => {
    console.log("renderInputToolbar --> props", props.isConnected);
    if (props.isConnected === false) {
    } else {
      return <InputToolbar {...props} />;
    }
  };
  
 /**
  * displays the communication features
  * @function renderCustomActions
  */
  renderCustomActions = props => <CustomActions {...props} />;

  //custom map view
  renderCustomView(props) {
    const { currentMessage } = props;
    if (currentMessage.location) {
      return (
        <MapView
          style={{ width: 150, height: 100, borderRadius: 13, margin: 3 }}
          region={{
            latitude: currentMessage.location.latitude,
            longitude: currentMessage.location.longitude,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421
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
      <View
        style={{
          flex: 1,
          backgroundColor: this.props.navigation.state.params.backgroundColor
        }}
      >
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
        {Platform.OS === "android" ? <KeyboardSpacer /> : null}
      </View>
    );
  }
}

const styles = StyleSheet.create({});
