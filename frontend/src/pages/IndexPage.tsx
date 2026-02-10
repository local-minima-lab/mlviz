import config from "@/assets/config.json";
import { Button } from "@/components/ui/button";
import type { Config } from "@/types/story";
import { Link } from "react-router-dom"; // Import Link

const IndexPage = () => {
    const storyConfig = config as unknown as Config;

    return (
        <div className="h-screen w-screen overflow-hidden flex flex-col bg-gradient-to-br from-blue-50 to-fuchsia-50">
            <div className="h-[15dvh] flex flex-col justify-self-center text-center">
                <h1 className="w-fit mx-auto font-extrabold tracking-tighter font-width-expanded pt-8 px-3 rounded-md bg-gradient-to-r from-fuchsia-600 to-blue-400 bg-clip-text text-transparent font-bold !text-7xl hover:opacity-80 transition-opacity">
                    mlviz
                </h1>
                <p className="w-fit mx-auto font-mono text-xs tracking-tightest bg-gradient-to-r from-fuchsia-900 to-blue-700 bg-clip-text text-transparent">
                    machine learning visualisations
                </p>
            </div>

            <div className="flex-1 mx-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 overflow-hidden">
                {Object.entries(storyConfig.stories).map(([name, s]) => (
                    <Link
                        key={s.name}
                        to={`/story/${name}`}
                    >
                        <Button className="group w-full flex flex-col items-start justify-center text-wrap bg-gradient-to-r from-gray-50 to-white text-gray-800 hover:from-fuchsia-500 hover:to-blue-400 hover:text-white transition-all duration-100 hover:shadow-lg font-light hover:font-medium rounded-3xl py-16 px-8 scroll-auto">
                            <span className="font-mono text-left tracking-tighter text-2xl text-wrap bg-gradient-to-r from-fuchsia-500 to-cyan-500 bg-clip-text text-transparent group-hover:from-fuchsia-100 group-hover:to-cyan-100 group-hover:text-4xl group-hover:font-bold">
                                {s.name}
                            </span>
                            <span className="text-sm tracking-tight text-left text-wrap mt-2">
                                {s.description}
                            </span>
                        </Button>
                    </Link>
                ))}
            </div>

            <footer className="shrink-0 border-t border-gray-200 px-4 py-2 flex items-center justify-between text-sm tracking-tight">
                <Link
                    className="px-3 py-1.5 rounded-md bg-gradient-to-r from-fuchsia-400 to-cyan-500 bg-clip-text text-transparent font-bold font-mono hover:opacity-80 transition-opacity"
                    to={"https://github.com/local-minima-lab"}
                >
                    a project by Local Minima Lab
                </Link>
                <Link
                    className="px-3 py-1.5 rounded-md bg-gradient-to-r from-fuchsia-500 to-cyan-500 bg-clip-text text-transparent font-mono hover:opacity-80 transition-opacity"
                    to={"https://github.com/zaidansani"}
                >
                    @zaidansani
                </Link>
            </footer>
        </div>
    );
};

export default IndexPage;
