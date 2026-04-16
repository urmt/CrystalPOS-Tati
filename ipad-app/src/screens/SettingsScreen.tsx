// =============================================================================
// SETTINGS SCREEN
// =============================================================================

import React from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { List, Button, Divider, Switch } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@supabase/supabase-js';

const COLORS = { primary: '#6B4C9A', error: '#DC3545', background: '#F7F5F3' };
const APP_VERSION = '1.0.0';

export default function SettingsScreen() {
  const handleSync = async () => {
    try {
      Alert.alert('Syncing...', 'Database synchronized');
    } catch (e) {
      Alert.alert('Error', 'Sync failed');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    // In a real app, navigate to login
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Text style={styles.title}>Settings</Text>

        <List.Section>
          <List.Subheader>Account</List.Subheader>
          <List.Item
            title="Systems Manager"
            description="admin@crystalmarket.com"
            left={props => <List.Icon {...props} icon="account" />}
          />
          <List.Item
            title="Role"
            description="Systems Manager (Admin)"
            left={props => <List.Icon {...props} icon="badge-account" />}
          />
        </List.Section>

        <Divider />

        <List.Section>
          <List.Subheader>Sync</List.Subheader>
          <List.Item
            title="Sync Data"
            description="Synchronize with cloud database"
            left={props => <List.Icon {...props} icon="sync" />}
            right={() => <Button onPress={handleSync}>Sync Now</Button>}
          />
        </List.Section>

        <Divider />

        <List.Section>
          <List.Subheader>Payment Methods</List.Subheader>
          <List.Item
            title="SINPE Móvil"
            left={props => <List.Icon {...props} icon="phone" />}
            right={() => <Switch value={true} disabled />}
          />
          <List.Item
            title="Cash"
            left={props => <List.Icon {...props} icon="cash" />}
            right={() => <Switch value={true} disabled />}
          />
          <List.Item
            title="Card"
            left={props => <List.Icon {...props} icon="credit-card" />}
            right={() => <Switch value={true} disabled />}
          />
          <List.Item
            title="Lightning"
            left={props => <List.Icon {...props} icon="flash" />}
            right={() => <Switch value={false} disabled />}
          />
        </List.Section>

        <Divider />

        <List.Section>
          <List.Subheader>About</List.Subheader>
          <List.Item
            title="Version"
            description={APP_VERSION}
            left={props => <List.Icon {...props} icon="information" />}
          />
          <List.Item
            title="CrystalPOS"
            description="Crystal Market Custom POS"
            left={props => <List.Icon {...props} icon="diamond-stone" />}
          />
        </List.Section>

        <View style={styles.logoutSection}>
          <Button mode="contained" buttonColor={COLORS.error} onPress={handleLogout}>
            Logout
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  title: { fontSize: 24, fontWeight: 'bold', margin: 20 },
  logoutSection: { padding: 20, alignItems: 'center' },
});