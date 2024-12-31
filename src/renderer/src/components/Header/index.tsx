import ConnectWalletButton from "../ConnectWalletButton";
import APP_LOGO from "@/assets/images/app_logo.png";
import { useState } from "react";
import { Link } from "react-router-dom";
import Icon from "../Icon";
import { Popover } from "flowbite-react";
// import BookMarkIcon from "../Icon/BookMarkIcon";
import InstallAppIcon from "../Icon/InstallAppIcon";
import U2UIcon from "../Icon/U2UIcon";
import LogOutIcon from "../Icon/LogOutIcon";
import Button from "../Button";
import { useLogout } from "@/hooks/useLogout";
import Modal from "../Modal";
import LOGOUT from "@/assets/images/logout.png";
import SearchInput from "../SearchInput";

export default function Header() {
  const { mutate: logout } = useLogout();

  const [showLogoutModal, setShowLogoutModal] = useState(false);

  return (
    <div className="flex items-center justify-between border-b-[1px] border-[#262626] bg-[#181818] px-[18px] py-6">
      <Link to="/" className="flex items-center gap-[10px]">
        <img
          src={APP_LOGO}
          alt="U2U Logo"
          className="h-[36px] w-[36px] object-cover"
        />
        <span className="font-bold">U2U DePIN Subnet Client</span>
      </Link>
      <div className="w-[624px]">
        <SearchInput />
      </div>
      <div className="flex-grow-y flex items-center gap-2">
        <ConnectWalletButton />
        <Popover
          aria-labelledby="profile-popover"
          arrow={false}
          content={
            <div className="mt-[20px] min-w-[333px] gap-2 rounded-md border-[1px] border-[#262626] bg-[#181818] p-2">
              {/* <button
                className="flex w-full cursor-pointer items-center gap-2 rounded-[8px] px-3 py-2 hover:bg-[#1F2225]"
                // onClick={handleDisconnect}
              >
                <BookMarkIcon />
                <div className="w-full text-left text-[16px] leading-[24px] text-white">
                  Bookmark
                </div>
              </button> */}
              <button
                className="flex w-full cursor-pointer items-center gap-2 rounded-[8px] px-3 py-2 hover:bg-[#1F2225]"
                // onClick={handleDisconnect}
              >
                <InstallAppIcon />
                <div className="w-full text-left text-[16px] leading-[24px] text-white">
                  Installed apps
                </div>
              </button>
              <button
                className="flex w-full cursor-pointer items-center gap-2 rounded-[8px] px-3 py-2 hover:bg-[#1F2225]"
                // onClick={handleDisconnect}
              >
                <U2UIcon />
                <div className="w-full text-left text-[16px] leading-[24px] text-white">
                  About
                </div>
              </button>

              <Modal
                trigger={(onClick) => (
                  <button
                    className="flex w-full cursor-pointer items-center gap-2 rounded-[8px] px-3 py-2 hover:bg-[#1F2225]"
                    onClick={onClick}
                  >
                    <LogOutIcon />
                    <div className="w-full text-left text-[16px] leading-[24px] text-white">
                      Disconnect
                    </div>
                  </button>
                )}
                visible={showLogoutModal}
                setVisible={setShowLogoutModal}
              >
                <div className="flex flex-col items-center gap-6">
                  <img src={LOGOUT} className="h-[80px] w-[80px]" />
                  <div className="flex flex-col gap-2 text-center">
                    <h2>Log Out</h2>
                    <span className="body-lg text-neutral-700">
                      Are you sure you want to log out this account?
                    </span>
                  </div>
                  <div className="flex w-full gap-[16px]">
                    <Button
                      fill
                      type="secondary"
                      onClick={() => setShowLogoutModal(false)}
                    >
                      Cancel
                    </Button>
                    <Button fill type="danger" onClick={() => logout()}>
                      Log out
                    </Button>
                  </div>
                </div>
              </Modal>
            </div>
          }
          theme={{
            base: "absolute z-20 inline-block w-max max-w-[100vw] border-none bg-transparent shadow-sm outline-none",
          }}
        >
          <div className="h-full cursor-pointer border-[1px] border-transparent">
            <Button type="transparent">
              <Icon name="profile" color={"white"} />
            </Button>
          </div>
        </Popover>
      </div>
    </div>
  );
}
