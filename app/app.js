$(document).ready(function () {
  app.initialized().then(function (_client) {
    window.client = _client;
    client.events.on('app.activated', function () {
      $("#disp_profile").hide();
      $("#submit").on("fwClick", getPerson);
      dispProfiles();
    });
  });
});
  
let obj = { "isDbPresent" : false, "profileId" : null }

/* On submit click. Fetch the contact's information from Enrich API */
function getPerson() {
  let fullName = $("#full_name").val(), email = $("#email").val(), phone_number = $("#phone_number").val();
  fetchContactDetails(fullName, email, phone_number).then(function (payload) {
    obj.isDbPresent ? updateProfile(fullName, email, phone_number) : saveProfile(fullName, email, phone_number);
    displayModal(payload);
    obj.profileId ? removeProfile(obj.profileId) : "";
  }).catch(function (error) {
    console.log(error);
  });
}

/* Create a data storage and store a contact's information */
function saveProfile(fullName, email, phone_number) {
  let createObject = new Object();
  let id = Math.floor(Math.random() * 1000000000);
  createObject[`profile_${id}`] = { fullName, email, phone_number }
  client.db.set("profiles", createObject).then(function () {
    obj.isDbPresent = true
  }, function (error) {
    console.log(error);
  });
}

/* Update data storage with new contact's information */
function updateProfile(fullName, email, phone_number) {
  let updateObj = new Object();
  let id = Math.floor(Math.random() * 1000000000);
  updateObj[`profile_${id}`] = { fullName, email, phone_number }
  client.db.update("profiles", "set", updateObj).then(function (data) {
    console.log(data);
  }, function (error) {
    console.log(error);
  });
}

/* Remove last contact's information */
function removeProfile (id) {
  client.db.update("profiles","remove", [id]).then(function(data) {
    console.log(data);
  }, function(error) {
    console.log(error);
  });
}

/* Display latest 5 contact's details */
function dispProfiles() {
  client.db.get("profiles").then(function (dbData) {
    obj.isDbPresent = true;
    obj.profileId = getLastId(dbData);
    let keysArr = Object.keys(dbData).reverse()
    keysArr.forEach(element => {
      let html = `<div class="lookup">
        <label>Full Name</label>
        <p>${dbData[element].fullName}</p>
        <label>Email Address</label>
        <p>${dbData[element].email}</p>
        <label>Phone Number</label>
        <p>${dbData[element].phone_number}</p>
      </div>`
    $("#disp_profile").append(html);
    });
    $("#disp_profile").show();
  }, function (error) {
    console.log("Error from Db : ", error);
  });
}

/* Find the last contact information */
function getLastId (dbData) {
  let keys = Object.keys(dbData);
  if(keys.length >= 5) {
    return keys[0];
  } else {
    console.log("Number of profiles looked up are less than 5.");
    return null
  }
}

/* Make API call to enrich API to fetch contact's information */
function fetchContactDetails(fullName, email, phone_number) {
  let opt = {
    headers: {
      "Authorization": "Bearer <%= iparam.apiKey %>",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      "full_name": fullName,
      "email": email,
      "phone": phone_number,
    })
  }
  let url = "https://api.fullcontact.com/v3/person.enrich"
  return new Promise(function (resolve) {
    client.request.post(url, opt).then(function (data) {
      resolve(JSON.parse(data.response));
    }, function (err) {
      let error = JSON.parse(err.response);
      console.log(error)
      displayNotification("danger", error.message);
    });
  });
}

/* Show modal to display contact's information */
function displayModal(payload) {
  client.interface.trigger("showModal", {
    title: "Contact Information",
    template: "modal.html",
    data: payload
  }).then(function (data) {
    console.log(data)
  }).catch(function (error) {
    console.log(error)
  });
}

function displayNotification(type, message) {
  client.interface.trigger('showNotify', { type: type, message: message });
}
