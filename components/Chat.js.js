import React, { Component } from 'react';
//import relevant components from react native
import { StyleSheet, Text, View } from 'react-native';

// create Screen2 (Chat) class
export default class Chat extends Component {

  //define title in navigation bar
  static navigationOptions = ({ navigation }) => {
    return {
      title: navigation.state.params.userName,
    };
  };
  //render components
  render() {
    return (
      //fullscreen component
      <View style={{ flex:1, justifyContent: 'center', alignItems: 'center', backgroundColor: this.props.navigation.state.params.backgroundColor }}>
        <Text>Hello Screen2!</Text>
      </View>
    );
  }
};

const styles = StyleSheet.create({

});