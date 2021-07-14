import React from 'react';
import { StyleSheet, Text, View, Image } from 'react-native';
import SearchScreen from './screens/searchScreen';
import BookTransactionScreen from './screens/bookTransactionScreen';
import { createBottomTabNavigator } from 'react-navigation-tabs';
import { createAppContainer } from 'react-navigation';

export default class App extends React.Component {
  render() {
    return (
      <View style={styles.container}>
        <AppContainer/>
      </View>
    );
  }
}

const TabNavigator = createBottomTabNavigator({
  Transaction: { screen: BookTransactionScreen },
  Search: { screen: SearchScreen },
},
  {
    defaultNavigationOptions: ({navigation}) => ({
      tabBarIcon: () => {
        const routeName = navigation.state.routeName;
        if (routeName === "Transaction") {
          return (
            <Image source={require('./assets/book.png')}
              style={{
                width: 30,
                height: 30
              }} />
          );
        }
        else if (routeName === "Search") {
          return (
            <Image source={require('./assets/searchingbook.png')}
              style={{
                width: 30,
                height: 30
              }} />
          );
        }
      }
    })
}
);

const AppContainer = createAppContainer(TabNavigator);



const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignContent: 'center',
    backgroundColor: '#fff'
  },
});
