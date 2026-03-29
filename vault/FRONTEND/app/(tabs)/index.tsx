import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import HomeScreen from '../src/main'; // Your newly separated main screen
import CustomDrawerContent from '../src/drawer'; // The drawer file
import { COLORS } from '../../constants/theme';

const Drawer = createDrawerNavigator();

export default function App() {
  return (
   
      <Drawer.Navigator
        drawerContent={(props) => <CustomDrawerContent {...props} />}
        screenOptions={{
          headerShown: false,
          drawerStyle: {
            backgroundColor: 'transparent', // Let the custom component handle background/radius
            width: '70%',
            maxWidth: 330,
          },
        }}
      >
        <Drawer.Screen name="Home" component={HomeScreen} />
      </Drawer.Navigator>
    
  );
}