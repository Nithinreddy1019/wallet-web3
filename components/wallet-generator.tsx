"use client"

import { useEffect, useState } from "react";
import { Button } from "./ui/button"
import { generateMnemonic, mnemonicToSeedSync, validateMnemonic } from "bip39";
import { Input } from "./ui/input";
import { toast } from "sonner";
import { ChevronDown, ChevronUp, Copy, Eye, EyeOff, Trash2 } from "lucide-react";
import { derivePath } from "ed25519-hd-key";
import nacl from "tweetnacl";
import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";
import { ethers } from "ethers";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "./ui/alert-dialog";



interface Wallet {
    publicKey: string, 
    privateKey: string,
    mnemonic: string,
    path: string
};

export const WalletGenerator = () => {
    

    const [isMounted, setIsMounted] = useState(false);
    const [mnemonicInput, setMenmonicInput] = useState("");
    const [mnemonicWords, setMnemonicWords] = useState<string[]>(Array(12).fill(" "));
    const [showMnemonic, setShowMnemonic] = useState(false);

    const [pathType, setPathType] = useState("");

    const [wallets, setWallets] = useState<Wallet[]>([]);

    const [visiblePrivateKeys, setVisiblePrivateKeys] = useState<boolean[]>([]);
    const [visiblePhrases, setVisiblePhrases] = useState<boolean[]>([]);


    const pathTypeNamesAvailable: Record<string, string> = {
        "501": "Solana",
        "60": "Ethereum"
    };
    const pathTypeName = pathTypeNamesAvailable[pathType] || "";




    useEffect(() => {
        setIsMounted(true);
    }, []);
    
    if (!isMounted) {
        return null;
    }

    const copyToClipboard = (content: string) => {
        navigator.clipboard.writeText(content);
        toast.success("Copied to clipboard!");
    };

    const togglePrivateKeyVisibility = (index: number) => {
        setVisiblePrivateKeys(
          visiblePrivateKeys.map((visible, i) => (i === index ? !visible : visible))
        );
    };


    const handleDeleteWallet = (index: number) => {
        const updatedWallets = wallets.filter((_, i) => i !== index);
       
    
        setWallets(updatedWallets);
        
        setVisiblePrivateKeys(visiblePrivateKeys.filter((_, i) => i !== index));
        setVisiblePhrases(visiblePhrases.filter((_, i) => i !== index));
        toast.success("Wallet deleted successfully!");
    };

    const handleClearWallets = () => {
        
        setWallets([]);
        setMnemonicWords([]);
        setPathType("");
        setVisiblePrivateKeys([]);
        setVisiblePhrases([]);
        toast.success("All wallets cleared.");
    };


    const generateWalletgivenMnemonic = (
        pathType: string,
        mnemonic: string, 
        accountIndex: number
    ): Wallet | null => {
        try {
            const seedBuffer = mnemonicToSeedSync(mnemonic);
            const path = `m/44'/${pathType}'/0'/${accountIndex}'`;
            const derivedSeed = derivePath(path, seedBuffer.toString("hex")).key;
      
            let publicKeyEncoded: string;
            let privateKeyEncoded: string;
      
            if (pathType === "501") {
                // @ts-ignore
                const secretKey = nacl.sign.keyPair.fromSeed(derivedSeed).secretKey;
                const keypair = Keypair.fromSecretKey(secretKey);

                privateKeyEncoded = bs58.encode(secretKey);
                publicKeyEncoded = keypair.publicKey.toBase58();

            } else if (pathType === "60") {

                //@ts-ignore
                const privateKey = Buffer.from(derivedSeed).toString("hex");
                privateKeyEncoded = privateKey;

                const wallet = new ethers.Wallet(privateKey);
                publicKeyEncoded = wallet.address;

            } else {

                toast.error("Unsupported path type.");
                return null;
            }
      
            return {
                publicKey: publicKeyEncoded,
                privateKey: privateKeyEncoded,
                mnemonic,
                path,
            };
        } catch (error) {
            toast.error("Failed to generate wallet!")
            return null;
        }
    }


    const handleGenerateMmemonic = () => {
        let mnemonic = mnemonicInput.trim();

        if(mnemonic) {
            if(!validateMnemonic(mnemonic)){
                toast.error("inivalid recovery phrase")
                return;
            }
        } else {
            mnemonic = generateMnemonic();
        };


        const words = mnemonic.split(" ");
        setMnemonicWords(words);

        const wallet = generateWalletgivenMnemonic(
            pathType,
            mnemonic,
            wallets.length
        );

        if(wallet) {
            const updatedWallets = [...wallets, wallet];
            setWallets(updatedWallets);
            console.log(updatedWallets);
            setVisiblePrivateKeys([...visiblePrivateKeys, false]);
            setVisiblePhrases([...visiblePhrases, false]);
            toast.success("Wallet generated successfully");
        }
    };

    const handleAddWallet = () => {
        if (!mnemonicWords) {
          toast.error("No mnemonic found. Please generate a wallet first.");
          return;
        }
    
        const wallet = generateWalletgivenMnemonic(
          pathType,
          mnemonicWords.join(" "),
          wallets.length
        );
        if (wallet) {
          const updatedWallets = [...wallets, wallet];
          setWallets(updatedWallets);
          setVisiblePrivateKeys([...visiblePrivateKeys, false]);
          setVisiblePhrases([...visiblePhrases, false]);
          toast.success("Wallet generated successfully!");
        }
    };
    
    return (
        <div>
            {wallets.length === 0 && (
                <div>
                    {pathType === "" && (
                        <div className="flex flex-col gap-4 my-12">
                            <div className="flex flex-col gap-2">
                                <h1 className="text-4xl md:text-5xl font-bold">
                                    We support multiple blockchains
                                </h1>
                                <p className="text-xl text-muted-foreground font-semibold">
                                    choose a blockchain to get started
                                </p>
                            </div>
                            
                            <div className="flex items-center gap-2">
                                <Button
                                    size="lg"
                                    onClick={() => setPathType("501")}
                                >
                                    Solana
                                </Button>

                                <Button
                                    size="lg"
                                    onClick={() => setPathType("60")}
                                >
                                    Ethereum
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Generating Menemonic */}
                    {pathType !== "" && (
                        <div className="flex flex-col gap-4 my-12">
                            <div className="flex flex-col gap-2">
                                <h1 className="text-4xl md:text-5xl font-bold">
                                    Secret Recovery Phrase
                                </h1>
                                <p className="text-xl text-muted-foreground font-semibold">
                                    Save these words in a safe place.
                                </p>
                            </div>

                            <div className="flex flex-col md:flex-row gap-4">
                                <Input 
                                    placeholder="Enter your secret or leave black to generate"
                                    onChange={(e) => setMenmonicInput(e.target.value)}
                                    value={mnemonicInput}
                                    className="h-10"
                                />
                                <Button
                                    className="font-normal"
                                    onClick={handleGenerateMmemonic}
                                >
                                    {mnemonicInput ? "Add wallet" : "Generate wallet"}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Show secret phrase */}
            {mnemonicWords && wallets.length > 0 && (
                <div className="border rounded-lg p-4 w-full mt-6">
                    <div
                        className="flex items-center justify-between w-full"
                        onClick={() => setShowMnemonic(!showMnemonic)}
                    >
                        <h1 className="text-3xl md:text-4xl font-semibold ">
                            Your secret phrase
                        </h1>

                        <Button
                            onClick={() => setShowMnemonic(!showMnemonic)}
                            variant="ghost"
                        >   
                            {showMnemonic ? (
                                <ChevronUp />
                            ) : (
                                <ChevronDown />
                            )}
                        </Button>
                    </div>

                    {showMnemonic && (
                        <div
                            className="flex flex-col w-full"
                            onClick={() => copyToClipboard(mnemonicWords.join(" "))}
                        >
                            <div>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 items-center justify-center w-full my-8 mx-auto gap-2">
                                    {mnemonicWords.map((word, index) => (
                                        <p
                                            key={index}
                                            className="md:text-lg bg-foreground/5 hover:bg-foreground/10 transition-all duration-300 rounded-lg p-2"
                                        >
                                            {word}
                                        </p>
                                    ))}
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground cursor-pointer hover:bg-secondary p-2 rounded-md transition">
                                    <Copy className="size-4"/>
                                    <p>Click anywhere to copy</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}


            {wallets.length > 0 && (
                <div
                    className="mt-6 flex flex-col gap-4 px-4 border rounded-lg py-4"
                >
                    <div className="flex flex-col md:flex-row md:items-center gap-2 w-full justify-between">
                        <h2 className="text-3xl md:text-4xl font-semibold ">
                            {pathTypeName} wallet
                        </h2>

                        <div className="flex flex-col md:flex-row items-center gap-2">
                            <Button
                                variant="secondary"
                                onClick={handleAddWallet}
                                className="w-full md:w-fit"
                            >   
                                Add wallet
                            </Button>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive" className="w-full md:w-fit">
                                        Clear all
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>
                                            Are you sure?
                                        </AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This cannot be undone.
                                            All wallets and keys will be deleted.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={handleClearWallets}
                                        >
                                            Delete
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {wallets.map((wallet, index) => (
                            <div
                                className="flex flex-col rounded-md border"
                            >
                                <div className="flex items-center justify-between px-4 py-4">
                                    <h3>
                                        Wallet {index + 1}
                                    </h3>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="destructive" className="w-full md:w-fit">
                                                <Trash2 className="size-4"/>
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>
                                                    Are you sure?
                                                </AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This cannot be undone.
                                                    This wallet will be deleted.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction
                                                    onClick={() => handleDeleteWallet(index)}
                                                >
                                                    Delete
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>

                                <div className="flex flex-col gap-6 px-4 py-4 bg-secondary/20">
                                    <div 
                                        className="flex flex-col gap-2 w-full"
                                        onClick={() => copyToClipboard(wallet.publicKey)}
                                    >
                                        <p className="text-lg font-semibold">Public key</p>
                                        <p className="text-sm hover:text-primary transition truncate cursor-pointer">{wallet.publicKey}</p>
                                    </div>
                                    <div className="flex flex-col gap-2 w-full">
                                        <p className="text-lg font-semibold">Private key</p>
                                        <div className="flex items-center justify-between w-full">
                                            <p className="text-sm hover:text-primary transition truncate cursor-pointer" onClick={() => copyToClipboard(wallet.privateKey)}>
                                                {visiblePrivateKeys[index] ? wallet.privateKey : "*".repeat(wallet.mnemonic.length)}
                                            </p>
                                            <Button
                                                variant="ghost"
                                                onClick={() => togglePrivateKeyVisibility(index)}
                                            >
                                                {visiblePrivateKeys[index] ? (
                                                <EyeOff className="size-4" />
                                                ) : (
                                                <Eye className="size-4" />
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

        </div>
    )
}