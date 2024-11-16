import Image from "next/image"
import { ThemeSwitcher } from "./theme-switch"


export const Navbar = () => {
    return (
        <div className="py-2">
            <div className="flex items-center justify-between h-16 border px-4 rounded-xl">
                <div>
                    <Image 
                        src={"/logo.svg"}
                        alt="Logo"
                        width={30}
                        height={30}
                    />
                </div>

                <ThemeSwitcher />
            </div>
        </div>
    )
}