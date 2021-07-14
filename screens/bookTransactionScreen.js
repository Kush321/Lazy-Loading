import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Image, TextInput, KeyboardAvoidingView, ToastAndroid, Alert } from 'react-native';
import * as Permissions from 'expo-permissions';
import { BarCodeScanner } from 'expo-barcode-scanner';
import firebase from 'firebase';
import db from '../config';

export default class BookTransactionScreen extends React.Component {
  constructor() {
    super();
    this.state = {
      hasCameraPermissions: null,
      scanned: false,
      scannedData: '',
      buttonState: 'normal',
      scannedBookID: '',
      scannedStudentID: '',
      transactionMessage: ''
    }
  }
  getCameraPermissions = async (id) => {
    const { status } = await Permissions.askAsync(Permissions.CAMERA);
    this.setState = ({
      hasCameraPermissions: status === "granted",
      buttonState: id,
      scanned: false
    })
  }
  handleBarcodeScanned = async ({ type, data }) => {
    //console.log(data);
    const { buttonState } = this.state.buttonState
    if (buttonState === "BookID") {
      this.setState = ({
        scanned: true,
        scannedBookID: data,
        buttonState: 'normal'
      })
    }
    else if (buttonState === "StudentID") {
      this.setState = ({
        scanned: true,
        scannedStudentID: data,
        buttonState: 'normal'
      })
    }
  }

  checkStudentEligibilityForBookIssue = async () => {
    const studentRef = await db.collection("students").where("studentID", "==", this.state.scannedStudentID).get()
    var isStudentEligible = ""
    if (studentRef.docs.length == 0) {
      this.setState({
        scannedStudentID: '',
        scannedBookID: ''
      })
      isStudentEligible = false;
      alert("The Student Does Not Exist In The Database!")
    }
    else {
      studentRef.docs.map((doc) => {
        var student = doc.data()
        if (student.numberofBooksIssued < 2) {
          isStudentEligible = true;
        }
        else {
          isStudentEligible = false;
          alert("Two Books Already Issued!")
          this.setState({
            scannedStudentID: '',
            scannedBookID: ''
          })
        }
      })
    }
    return isStudentEligible;
  }

  checkStudentEligibilityForReturn = async () => {
    const transactionRef = await db.collection("transaction").where("bookID", "==", this.state.scannedBookID).limit(1).get();
    var isStudentEligible = ""
    transactionRef.docs.map((doc) => {
      var lastBookTransaction = doc.data()
      if (lastBookTransaction.studentID === this.state.scannedStudentID) {
        isStudentEligible = true
      }
      else {
        isStudentEligible = false
        alert("The Book Was Not Issued By This Student!")
        this.setState({
          scannedStudentID: '',
          scannedBookID: ''
        })
      }
    })
    return isStudentEligible;
  }

  checkBookEligibility = async () => {
    const bookRef = await db.collection("books").where("bookID", "==", this.state.scannedBookID).get();
    var transactionType = ""
    if(bookRef.docs.length == 0){
      transactionType = false;
    }
    else {
      bookRef.docs.map((doc) => {
        var book = doc.data()
        if (book.bookAvailability){
          transactionType = "Issue"
        }
        else {
          transactionType = "Return"
        }
      })
    }
    return transactionType;
  }

  handleTransaction = async () => {
    //console.log(this.state.scannedStudentID)
    var transactionType = await this.checkBookEligibility();
    if (!transactionType){
      alert("The Book Does Not Exist In The Database!")
      this.setState({
        scannedStudentID: '',
        scannedBookID: ''
      })
    }
    else if ( transactionType === "Issue" ) {
      var isStudentEligible = await this.checkStudentEligibilityForBookIssue();
      if ( isStudentEligible ) {
        this.initiateBookIssue();
        alert("The Book Was Succesfully Issued")
      }
    }
    else {
      var isStudentEligible = await this.checkStudentEligibilityForReturn();
      if (isStudentEligible) {
        this.initiateBookReturn();
        alert("The Book Was Succesfully Returned")
      }
    }
  }

  initiateBookIssue = async () => {
    //add transaction
    db.collection("transaction").add({
      'studentID': this.state.scannedStudentID,
      'bookID': this.state.scannedBookID,
      'date': firebase.firestore.Timestamp.now().toDate(),
      'transactionType': "Issue"
    })
    //change book status
    db.collection("books").doc(this.state.scannedBookID).update({
      'bookAvailability': false
    })
    //number of books issued per student
    db.collection("students").doc(this.state.scannedStudentID).update({
      'numberofBooksIssued': firebase.firestore.FieldValue.increment(1)
    })
    this.setState({
      scannedStudentID: '',
      scannedBookID: ''
    })
  }

  initiateBookReturn = async () => {
    //add transaction
    db.collection("transaction").add({
      'studentID': this.state.scannedStudentID,
      'bookID': this.state.scannedBookID,
      'date': firebase.firestore.Timestamp.now().toDate(),
      'transactionType': "Return"
    })
    //change book status
    db.collection("books").doc(this.state.scannedBookID).update({
      'bookAvailability': true
    })
    //number of books issued per student
    db.collection("students").doc(this.state.scannedStudentID).update({
      'numberofBooksIssued': firebase.firestore.FieldValue.increment(-1)
    })
    this.setState({
      scannedStudentID: '',
      scannedBookID: ''
    })
  }

  render() {
    const hasCameraPermissions = this.state.hasCameraPermissions;
    const scanned = this.state.scanned;
    const buttonState = this.state.buttonState;
    if (buttonState === "clicked" && hasCameraPermissions) {
      return (
        <BarCodeScanner
          onBarcodeScanned={scanned ? undefined : this.handleBarcodeScanned}
          style={styles.absoluteFillObject}
        />
      );
    }
    else if (buttonState === "normal") {
      return (
        <KeyboardAvoidingView style={styles.container}>
          <Text style={styles.displayText}>
            {hasCameraPermissions === true ? this.state.scannedData : 'Request Camera Permissions'}
          </Text>
          <View>
            <Image
              source={require("../assets/booklogo.jpg")}
              style={{
                width: 200,
                height: 200,
              }} />
            <Text
              style={{
                textAlign: 'center',
                fontSize: 30,
              }}>
              Wily App
            </Text>
          </View>
          <View
            style={styles.inputView}>
            <TextInput
              style={styles.inputBox}
              placeholder="Book ID"
              onChangeText={
                text => this.setState({
                  scannedBookID: text
                })
              }
              value={this.state.scannedBookID}>

            </TextInput>
            <TouchableOpacity
              onPress={() => {
                this.getCameraPermissions("BookID")
              }
              }
              style={styles.scanButton}>
              <Text style={styles.buttonText}>
                Scan
              </Text>
            </TouchableOpacity>
          </View>
          <View
            style={styles.inputView}>
            <TextInput
              style={styles.inputBox}
              placeholder="Student ID"
              onChangeText={
                text => this.setState({
                  scannedStudentID: text
                })
              }
              value={this.state.scannedStudentID}>

            </TextInput>

            <TouchableOpacity
              onPress={() => {
                this.getCameraPermissions("StudentID")
              }
              }
              style={styles.scanButton}>
              <Text style={styles.buttonText}>
                Scan
              </Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            onPress={async () => {
              var transactionMessage = this.handleTransaction();
              this.setState({
                //scannedStudentID: '',
                //scannedBookID: ''
              })
            }
            }
            style={styles.submitButton}>
            <Text style={styles.buttonText}>
              Submit
            </Text>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      );
    }
  }
}
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  displayText: { fontSize: 15, textDecorationLine: 'underline' },
  scanButton: { backgroundColor: '#2196F3' },
  buttonText: { fontSize: 20, marginTop: 8, marginLeft: 5, marginRight: 5 },
  inputView: { flexDirection: 'row', margin: 20 },
  inputBox: { width: 300, height: 40, borderWidth: 1.5, fontSize: 20, },
  submitButton: { backgroundColor: '#FBC02D', width: 100, height: 50, textAlign: 'center' }
});
