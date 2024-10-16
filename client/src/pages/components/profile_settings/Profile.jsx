import { useState, useEffect, useRef } from "react";
import Cookies from "js-cookie";

import { updateDetails } from "../../../api/API";
import updateProfile from "../UpdateProfile";
import logout from "../tools/auth";

import SuccessMessage from "../messageBox/SuccessMessage";

const Profile = () => {
  const user = useRef(
    Cookies.get("sessionUser") ? JSON.parse(Cookies.get("sessionUser")) : null
  );
  const days = Cookies.get("sessionDays")
    ? Number(Cookies.get("sessionDays"))
    : 0;
  if (user.current == null || days == 0) {
    window.location.href = "/profile";
  }
  const userBio = localStorage.getItem("userBio") || "";
  const profileAvatar = useRef(null);
  useEffect(() => {
    if (!localStorage.getItem("avatar")) {
      updateProfile();
    }
  }, []);
  profileAvatar.current = localStorage.getItem("avatar") || "";

  const [newUserData, setUserData] = useState({
    fname: user.current?.fname || "",
    lname: user.current?.lname || "",
    region: user.current?.region || "",
    bio: userBio,
  });
  const Id = user.current.id;
  const [isUpdated, setIsUpdated] = useState(false);
  const [responseMssg, SetResponseMssg] = useState("");
  const [charCount, setCharCount] = useState(0);
  const maxCharLimit = 210;

  const handleDataChange = (e) => {
    if (e.target.name === "bio" && e.target.value.length > maxCharLimit) return;
    setUserData((preVal) => {
      return {
        ...preVal,
        [e.target.name]: e.target.value,
      };
    });
    if (e.target.name === "bio") {
      setCharCount(e.target.value.length);
    }
  };

  const [selectedImage, setSelectedImage] = useState(null);
  useEffect(() => {
    setSelectedImage(profileAvatar.current);
  }, []);

  const [selectedFile, setSelectedFile] = useState(null);
  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setSelectedImage(imageUrl);
      setSelectedFile(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsUpdated(false);

    if (!user.current) {
      logout();
      return;
    }

    if (!newUserData.fname && !newUserData.lname && !newUserData.region) {
      alert("Input field is empty");
      return;
    }

    if (
      newUserData.fname === user.current?.fname &&
      newUserData.lname === user.current?.lname &&
      newUserData.region === user.current?.region &&
      newUserData.bio === user.current.bio
    ) {
      return;
    }

    const formData = new FormData();
    formData.append("id", Id);
    if (newUserData.fname !== user.current?.fname || "")
      formData.append("fname", newUserData.fname);
    if (newUserData.lname !== user.current?.lname || "")
      formData.append("lname", newUserData.lname);
    if (newUserData.region !== user.current?.region || "")
      formData.append("region", newUserData.region);
    if (newUserData.bio !== user.current.bio)
      formData.append("bio", newUserData.bio);
    if (selectedFile) formData.append("avatar_image", selectedFile);

    try {
      const response = await updateDetails(formData);
      if (response.status == 200) {
        const updatedUser = {
          ...user.current,
          fname: newUserData.fname,
          lname: newUserData.lname,
          region: newUserData.region,
        };
        user.current = updatedUser;
        Cookies.set("sessionUser", JSON.stringify(user.current), {
          expires: days,
        });
        localStorage.setItem("userBio", newUserData.bio);
        SetResponseMssg(response.data.message);
        setIsUpdated(true);
        setTimeout(() => {
          window.location.href = "profile";
        }, 300);
      } else {
        alert("Something went wrong !");
        window.location.href = "/";
      }
    } catch (error) {
      if (
        error.response.status == 403 || //Not Authenticated
        error.response.status == 404 || //User not found
        error.response.status == 500 //Server error
      ) {
        logout();
      }
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit}>
        <SuccessMessage isSuccess={isUpdated} successMssg={responseMssg} />
        <div className="settings-image-selector">
          {selectedImage && (
            <div className="settings-image-avatar">
              <img
                src={selectedImage}
                alt="Selected"
                style={{ width: "100px", height: "100px" }}
              />
            </div>
          )}
          <div className="settings-image">
            <h5>Update profile avatar</h5>
            <input
              type="file"
              className="upload-custom-avatar"
              accept="image/*"
              onChange={handleImageChange}
            />
          </div>
        </div>
        <div className="u-fullwidth menu-section-profile">
          <div className="profile-input-names">
            <label className="profile-label-styles" htmlFor="pfName">
              First Name
            </label>
            <input
              className="profile-input-name profile-input-styles"
              type="text"
              id="fName"
              name="fname"
              required
              value={newUserData?.fname || ""}
              placeholder="First Name"
              onChange={handleDataChange}
            />
          </div>
          <div className="profile-input-name">
            <label className="profile-label-styles" htmlFor="plName">
              Last Name
            </label>
            <input
              className="profile-input-name profile-input-styles"
              type="text"
              id="lName"
              name="lname"
              required
              value={newUserData?.lname || ""}
              placeholder="Last Name"
              onChange={handleDataChange}
            />
          </div>
        </div>
        <div>
          <label className="profile-label-styles" htmlFor="pRegion">
            Region
          </label>
          <input
            className="u-fullwidth profile-input-styles"
            type="text"
            id="pRegion"
            name="region"
            required
            value={newUserData?.region || ""}
            placeholder="City, State, Country"
            onChange={handleDataChange}
          />
        </div>
        <div style={{ position: "relative" }}>
          <label className="profile-label-styles" htmlFor="pBio">
            Bio
          </label>
          <textarea
            className="u-fullwidth"
            placeholder="Your Bio"
            id="pBio"
            name="bio"
            required
            value={newUserData.bio}
            onChange={handleDataChange}
          ></textarea>
          <p
            style={{
              position: "absolute",
              padding: "0 10px 0 5px",
              right: "1px",
              bottom: "1px",
              fontSize: "12px",
              marginBottom: "0",
              color: charCount > maxCharLimit ? "red" : "gray",
            }}
          >
            {maxCharLimit - `${charCount ? charCount : newUserData.bio.length}`}{" "}
            characters remaining
          </p>
        </div>
        <button
          className="btn--primary u-quartorwidth profile-button-styles"
          type="submit"
        >
          Update
        </button>
      </form>
    </>
  );
};

export default Profile;
