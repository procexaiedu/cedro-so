'use client'

import { AppShell } from '@/components/layout/app-shell'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Cloud, Diamond, Cube3D } from '@/components/decorative'
import { Badge } from '@/components/ui/badge'

export default function DesignSystemPage() {
  return (
    <AppShell>
      <div className="space-y-spacing-l">
        {/* Header */}
        <div className="text-center border-b-standard border-motherduck-dark pb-spacing-m">
          <h1 className="font-mono text-display-2 font-bold text-motherduck-dark uppercase tracking-wider">
            Design System
          </h1>
          <p className="text-body-lg text-motherduck-dark/70 mt-spacing-xs">
            MotherDuck Style Guide aplicado ao Sistema Cedro
          </p>
        </div>

        {/* Colors */}
        <section>
          <h2 className="font-mono text-heading-3 font-bold text-motherduck-dark uppercase mb-spacing-xs border-b-standard border-motherduck-dark pb-spacing-xxs">
            Cores
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-spacing-xs">
            <Card>
              <CardContent className="pt-spacing-m">
                <div className="h-20 bg-motherduck-dark rounded-minimal mb-spacing-xxs border-standard border-motherduck-dark"></div>
                <p className="font-mono text-caption uppercase">Dark</p>
                <p className="text-caption text-motherduck-dark/70">#383838</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-spacing-m">
                <div className="h-20 bg-motherduck-teal rounded-minimal mb-spacing-xxs border-standard border-motherduck-dark"></div>
                <p className="font-mono text-caption uppercase">Teal</p>
                <p className="text-caption text-motherduck-dark/70">#16AA98</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-spacing-m">
                <div className="h-20 bg-motherduck-beige rounded-minimal mb-spacing-xxs border-standard border-motherduck-dark"></div>
                <p className="font-mono text-caption uppercase">Beige</p>
                <p className="text-caption text-motherduck-dark/70">#F4EFEA</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-spacing-m">
                <div className="h-20 bg-motherduck-blue rounded-minimal mb-spacing-xxs border-standard border-motherduck-dark"></div>
                <p className="font-mono text-caption uppercase">Blue</p>
                <p className="text-caption text-motherduck-dark/70">#6fc2ff</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Typography */}
        <section>
          <h2 className="font-mono text-heading-3 font-bold text-motherduck-dark uppercase mb-spacing-xs border-b-standard border-motherduck-dark pb-spacing-xxs">
            Tipografia
          </h2>
          <Card>
            <CardContent className="pt-spacing-m space-y-spacing-xs">
              <div>
                <p className="font-mono text-display-1 font-bold text-motherduck-dark">DISPLAY 1</p>
                <p className="text-caption text-motherduck-dark/70 mt-1">Space Mono • 96px • Bold</p>
              </div>
              <div>
                <p className="font-mono text-heading-1 font-bold text-motherduck-dark uppercase">HEADING 1</p>
                <p className="text-caption text-motherduck-dark/70 mt-1">Space Mono • 56px • Bold</p>
              </div>
              <div>
                <p className="font-mono text-heading-3 font-bold text-motherduck-dark uppercase">HEADING 3</p>
                <p className="text-caption text-motherduck-dark/70 mt-1">Space Mono • 40px • Bold</p>
              </div>
              <div>
                <p className="text-body-lg text-motherduck-dark">Body Large - Inter regular 18px para textos longos e conteúdo principal.</p>
                <p className="text-caption text-motherduck-dark/70 mt-1">Inter • 18px • Regular</p>
              </div>
              <div>
                <p className="text-body-md text-motherduck-dark">Body Medium - Inter regular 16px para descrições e parágrafos.</p>
                <p className="text-caption text-motherduck-dark/70 mt-1">Inter • 16px • Regular</p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Buttons */}
        <section>
          <h2 className="font-mono text-heading-3 font-bold text-motherduck-dark uppercase mb-spacing-xs border-b-standard border-motherduck-dark pb-spacing-xxs">
            Botões
          </h2>
          <Card>
            <CardContent className="pt-spacing-m">
              <div className="flex flex-wrap gap-spacing-xxs">
                <Button variant="default">Default Button</Button>
                <Button variant="teal">Teal Button</Button>
                <Button variant="outline">Outline Button</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="ghost">Ghost Button</Button>
                <Button variant="link">Link Button</Button>
              </div>
              <div className="flex flex-wrap gap-spacing-xxs mt-spacing-xs">
                <Button variant="default" size="sm">Small</Button>
                <Button variant="default" size="default">Default</Button>
                <Button variant="default" size="lg">Large</Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Cards */}
        <section>
          <h2 className="font-mono text-heading-3 font-bold text-motherduck-dark uppercase mb-spacing-xs border-b-standard border-motherduck-dark pb-spacing-xxs">
            Cards
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-spacing-xs">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle>Card Title</CardTitle>
                <CardDescription>Uma descrição do card usando o estilo MotherDuck.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-body-md text-motherduck-dark/70">
                  Conteúdo do card com bordas 2px, fonte monospace para títulos e tipografia Inter para corpo.
                </p>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle>Estatísticas</CardTitle>
                <CardDescription>Cards de métricas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="font-mono text-heading-2 font-bold text-motherduck-dark">42</div>
                <p className="text-caption text-motherduck-dark/70 mt-spacing-xxs">+12% este mês</p>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle>Com Badge</CardTitle>
                <CardDescription>Exemplo com badges</CardDescription>
              </CardHeader>
              <CardContent className="space-y-spacing-xxs">
                <Badge className="uppercase">Ativo</Badge>
                <Badge variant="secondary" className="uppercase ml-2">Pendente</Badge>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Forms */}
        <section>
          <h2 className="font-mono text-heading-3 font-bold text-motherduck-dark uppercase mb-spacing-xs border-b-standard border-motherduck-dark pb-spacing-xxs">
            Formulários
          </h2>
          <Card>
            <CardContent className="pt-spacing-m space-y-spacing-xs">
              <div>
                <label className="font-mono text-caption uppercase text-motherduck-dark block mb-spacing-xxs">
                  Nome Completo
                </label>
                <Input placeholder="DIGITE SEU NOME..." />
              </div>
              <div>
                <label className="font-mono text-caption uppercase text-motherduck-dark block mb-spacing-xxs">
                  Email
                </label>
                <Input type="email" placeholder="DIGITE SEU EMAIL..." />
              </div>
              <Button variant="teal" className="w-full">
                Enviar Formulário
              </Button>
            </CardContent>
          </Card>
        </section>

        {/* Decorative Elements */}
        <section>
          <h2 className="font-mono text-heading-3 font-bold text-motherduck-dark uppercase mb-spacing-xs border-b-standard border-motherduck-dark pb-spacing-xxs">
            Elementos Decorativos
          </h2>
          <Card>
            <CardContent className="pt-spacing-m">
              <div className="flex justify-around items-center flex-wrap gap-spacing-m">
                <div className="text-center">
                  <Cloud className="text-motherduck-blue" size={120} />
                  <p className="font-mono text-caption uppercase mt-spacing-xxs">Cloud</p>
                </div>
                <div className="text-center">
                  <Diamond className="text-motherduck-teal" size={80} />
                  <p className="font-mono text-caption uppercase mt-spacing-xxs">Diamond</p>
                </div>
                <div className="text-center">
                  <Cube3D className="text-motherduck-blue" size={100} />
                  <p className="font-mono text-caption uppercase mt-spacing-xxs">3D Cube</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Spacing */}
        <section>
          <h2 className="font-mono text-heading-3 font-bold text-motherduck-dark uppercase mb-spacing-xs border-b-standard border-motherduck-dark pb-spacing-xxs">
            Espaçamento
          </h2>
          <Card>
            <CardContent className="pt-spacing-m space-y-spacing-xxs">
              <div className="flex items-center gap-spacing-xs">
                <div className="h-8 bg-motherduck-teal" style={{ width: '8px' }}></div>
                <span className="font-mono text-caption">XXS (8px)</span>
              </div>
              <div className="flex items-center gap-spacing-xs">
                <div className="h-8 bg-motherduck-teal" style={{ width: '20px' }}></div>
                <span className="font-mono text-caption">XS (20px)</span>
              </div>
              <div className="flex items-center gap-spacing-xs">
                <div className="h-8 bg-motherduck-teal" style={{ width: '30px' }}></div>
                <span className="font-mono text-caption">S (30px)</span>
              </div>
              <div className="flex items-center gap-spacing-xs">
                <div className="h-8 bg-motherduck-teal" style={{ width: '32px' }}></div>
                <span className="font-mono text-caption">M (32px)</span>
              </div>
              <div className="flex items-center gap-spacing-xs">
                <div className="h-8 bg-motherduck-teal" style={{ width: '40px' }}></div>
                <span className="font-mono text-caption">L (40px)</span>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </AppShell>
  )
}
