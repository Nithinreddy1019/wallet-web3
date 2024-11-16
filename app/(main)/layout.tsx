import { Navbar } from "@/components/navbar";


const MainLayout = ({
    children
}: { children: React.ReactNode}) => {
    return (
        <div>
            <div className="w-full max-w-4xl mx-auto">
                <Navbar />
                {children}
            </div>
        </div>
    );
}
 
export default MainLayout;